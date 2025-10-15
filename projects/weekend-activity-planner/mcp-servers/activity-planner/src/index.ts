#!/usr/bin/env node

/**
 * Activity Planner MCP Server
 *
 * Provides kid activity recommendations with multi-component scoring algorithm.
 * Designed for family with kids ages 3 & 5 in Oakland/East Bay area.
 *
 * Scoring components (weighted):
 * - Rating (40%): avg_rating from past visits
 * - Novelty (30%): Based on visit frequency (prefer new experiences)
 * - Drive time (20%): Exponential decay past 30 minutes
 * - Age match (5%): Activities appropriate for ages 3-5
 * - Weather (5%): Indoor/outdoor match to weather conditions
 *
 * Tools provided:
 * - query_activities: Basic search/filter for activities
 * - suggest_activity_chain: Main recommendation engine with scoring
 * - get_activity_details: Full details including visit history
 * - check_opening_hours: Opening hours check (v1 stub)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from project root (2 levels up from mcp-servers/activity-planner/src/)
dotenv.config({ path: '../../../.env' });

// ============================================
// Environment Validation
// ============================================

/**
 * Validate required environment variables on startup
 * Fail fast if critical configuration is missing
 */
function validateEnvironment(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please ensure .env file exists in project root with these variables.'
    );
  }
}

// Validate on startup
validateEnvironment();

// ============================================
// Supabase Client Initialization
// ============================================

/**
 * Initialize Supabase client with SERVICE_ROLE_KEY for server-side operations
 *
 * Security note: Using SERVICE_ROLE_KEY grants full database access.
 * Input validation and query sanitization are critical.
 */
const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// Type Definitions
// ============================================

/**
 * Activity record from Supabase
 * Maps to activities table schema
 */
interface Activity {
  id: string;
  name: string;
  description: string | null;
  category: string;
  city: string;
  address: string | null;
  drive_time_minutes: number | null;
  age_min: number;
  age_max: number;
  indoor_outdoor: 'indoor' | 'outdoor' | 'both';
  weather_dependent: boolean;
  cost_per_visit: number | null;
  avg_rating: number | null;
  times_visited: number;
  last_visited_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Visit record from Supabase
 * Tracks family visit history with age-specific ratings
 */
interface Visit {
  id: string;
  activity_id: string;
  visited_at: string;
  liked_by_3yo: boolean | null;
  liked_by_5yo: boolean | null;
  would_return: boolean | null;
  notes: string | null;
  created_at: string | null;
}

/**
 * Scored activity with breakdown of scoring components
 */
interface ScoredActivity extends Activity {
  score: number;
  score_breakdown: {
    rating_component: number;
    novelty_component: number;
    drive_time_component: number;
    age_match_component: number;
    weather_component: number;
  };
}

/**
 * Tool argument interfaces
 */
interface QueryActivitiesArgs {
  age_min?: number;
  age_max?: number;
  max_drive_time?: number;
  indoor_outdoor?: string;
  city?: string;
  limit?: number;
}

interface SuggestActivityChainArgs {
  date: string;
  num_suggestions?: number;
  weather_condition?: string;
  attendees?: string[];
}

interface GetActivityDetailsArgs {
  activity_id: string;
}

interface CheckOpeningHoursArgs {
  activity_id: string;
  date: string;
  time?: string;
}

// ============================================
// Security Utilities
// ============================================

/**
 * UUID validation regex
 * Validates format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format
 * Returns true if valid, false otherwise
 *
 * Security: ALWAYS validate UUIDs before database queries to prevent injection
 */
function isValidUUID(uuid: string): boolean {
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

/**
 * Sanitize error messages for client responses
 * Removes internal details like table names, column names, UUIDs
 *
 * Security: Never expose internal database structure to clients
 */
function sanitizeError(error: unknown): string {
  if (error instanceof Error) {
    // Generic message - don't expose internal details
    return 'An error occurred while processing your request';
  }
  return 'An unexpected error occurred';
}

/**
 * Allowed cities (whitelist)
 * Prevents SQL injection via city parameter
 */
const ALLOWED_CITIES = [
  'Oakland',
  'Berkeley',
  'Walnut Creek',
  'Lafayette',
  'Orinda',
  'SF',
  'San Francisco',
];

/**
 * Allowed indoor/outdoor values (whitelist)
 */
const ALLOWED_INDOOR_OUTDOOR = ['indoor', 'outdoor', 'both'];

/**
 * Allowed weather conditions (whitelist)
 */
const ALLOWED_WEATHER = ['sunny', 'rainy', 'cold', 'hot', 'mild'];

/**
 * Allowed attendees (whitelist)
 */
const ALLOWED_ATTENDEES = ['3yo', '5yo', 'both'];

/**
 * ISO date format regex (YYYY-MM-DD)
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate date format
 */
function isValidDate(date: string): boolean {
  return typeof date === 'string' && DATE_REGEX.test(date);
}

/**
 * Validate and constrain numeric parameters
 * Ensures numbers are positive and within reasonable bounds
 */
function validateNumber(
  value: number | undefined,
  min: number,
  max: number,
  defaultValue: number
): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return defaultValue;
  }

  // Constrain to valid range
  return Math.max(min, Math.min(max, value));
}

// ============================================
// Scoring Algorithm Components
// ============================================

/**
 * Calculate rating component (40% weight)
 * Uses avg_rating, defaults to 0.5 if no rating exists
 */
function calculateRatingComponent(avgRating: number | null): number {
  return avgRating ?? 0.5;
}

/**
 * Calculate novelty component (30% weight)
 * Based on visit frequency - prefer activities not visited recently
 *
 * Formula: 1.0 - min(visits_count / 10, 1.0)
 * - Never visited: 1.0
 * - Visited 5 times: 0.5
 * - Visited 10+ times: 0.0
 */
function calculateNoveltyComponent(visitsCount: number): number {
  const visitFrequency = Math.min(visitsCount / 10, 1.0);
  return 1.0 - visitFrequency;
}

/**
 * Calculate drive time component (20% weight)
 * Exponential decay past 30 minutes
 *
 * Formula:
 * - <= 30 min: 1.0
 * - > 30 min: e^(-(drive_time - 30) / 30)
 *
 * Rationale: With young kids, longer drives require higher ratings to justify
 */
function calculateDriveTimeComponent(driveTimeMinutes: number | null): number {
  const driveTime = driveTimeMinutes ?? 30;

  if (driveTime <= 30) {
    return 1.0;
  }

  return Math.exp(-(driveTime - 30) / 30);
}

/**
 * Calculate age match component (5% weight)
 * Checks if activity age range covers both kids (3 & 5)
 */
function calculateAgeMatchComponent(ageMin: number, ageMax: number): number {
  // Perfect match: covers ages 3-5
  if (ageMin <= 3 && ageMax >= 5) {
    return 1.0;
  }
  // Partial match: covers at least one kid
  return 0.5;
}

/**
 * Calculate weather component (5% weight)
 * Matches activity indoor/outdoor type to weather condition
 */
function calculateWeatherComponent(
  indoorOutdoor: string,
  weatherCondition?: string
): number {
  if (!weatherCondition) {
    return 0.5; // Neutral if no weather specified
  }

  switch (weatherCondition) {
    case 'rainy':
      // Prefer indoor or both for rainy weather
      return indoorOutdoor !== 'outdoor' ? 1.0 : 0.3;

    case 'sunny':
      // Prefer outdoor or both for sunny weather
      return indoorOutdoor !== 'indoor' ? 1.0 : 0.3;

    case 'cold':
      // Prefer indoor for cold weather
      return indoorOutdoor === 'indoor' ? 1.0 : 0.3;

    case 'hot':
      // Prefer not outdoor for very hot weather (indoor AC or water activities)
      return indoorOutdoor !== 'outdoor' ? 1.0 : 0.3;

    case 'mild':
      // Any type works for mild weather
      return 0.8;

    default:
      return 0.5;
  }
}

/**
 * Calculate overall activity score using all 5 components
 *
 * Weights:
 * - Rating: 40%
 * - Novelty: 30%
 * - Drive time: 20%
 * - Age match: 5%
 * - Weather: 5%
 */
function calculateActivityScore(
  activity: Activity,
  visitsCount: number,
  weatherCondition?: string
): { score: number; breakdown: ScoredActivity['score_breakdown'] } {
  const ratingComp = calculateRatingComponent(activity.avg_rating);
  const noveltyComp = calculateNoveltyComponent(visitsCount);
  const driveTimeComp = calculateDriveTimeComponent(activity.drive_time_minutes);
  const ageMatchComp = calculateAgeMatchComponent(activity.age_min, activity.age_max);
  const weatherComp = calculateWeatherComponent(activity.indoor_outdoor, weatherCondition);

  const score =
    (0.4 * ratingComp) +
    (0.3 * noveltyComp) +
    (0.2 * driveTimeComp) +
    (0.05 * ageMatchComp) +
    (0.05 * weatherComp);

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimals
    breakdown: {
      rating_component: Math.round(ratingComp * 100) / 100,
      novelty_component: Math.round(noveltyComp * 100) / 100,
      drive_time_component: Math.round(driveTimeComp * 100) / 100,
      age_match_component: Math.round(ageMatchComp * 100) / 100,
      weather_component: Math.round(weatherComp * 100) / 100,
    },
  };
}

// ============================================
// Tool Implementations
// ============================================

/**
 * Tool 1: query_activities
 *
 * Basic activity search with filtering
 * Returns activities matching specified criteria
 *
 * @param args - QueryActivitiesArgs with optional filters
 * @returns JSON string with matching activities
 *
 * Security:
 * - Validates all numeric ranges
 * - Whitelists city and indoor_outdoor values
 * - Uses Supabase query builder (no raw SQL)
 */
export async function queryActivities(args: QueryActivitiesArgs): Promise<string> {
  try {
    // ========================================
    // Input Validation
    // ========================================

    // Validate age parameters (0-18)
    const ageMin = args.age_min !== undefined
      ? validateNumber(args.age_min, 0, 18, 0)
      : undefined;

    const ageMax = args.age_max !== undefined
      ? validateNumber(args.age_max, 0, 18, 18)
      : undefined;

    // Validate drive time (0-180 minutes)
    const maxDriveTime = args.max_drive_time !== undefined
      ? validateNumber(args.max_drive_time, 0, 180, 180)
      : undefined;

    // Validate indoor_outdoor (whitelist)
    let indoorOutdoor: string | undefined = undefined;
    if (args.indoor_outdoor) {
      const normalized = args.indoor_outdoor.toLowerCase().trim();
      if (ALLOWED_INDOOR_OUTDOOR.includes(normalized)) {
        indoorOutdoor = normalized;
      } else {
        return JSON.stringify({
          error: `Invalid indoor_outdoor value. Allowed: ${ALLOWED_INDOOR_OUTDOOR.join(', ')}`,
          data: null,
        });
      }
    }

    // Validate city (whitelist)
    let city: string | undefined = undefined;
    if (args.city) {
      const normalized = args.city.trim();
      if (ALLOWED_CITIES.includes(normalized)) {
        city = normalized;
      } else {
        return JSON.stringify({
          error: `Invalid city. Allowed: ${ALLOWED_CITIES.join(', ')}`,
          data: null,
        });
      }
    }

    // Validate limit (1-50, default 10)
    const limit = validateNumber(args.limit, 1, 50, 10);

    // ========================================
    // Query Activities
    // ========================================

    let query = supabase.from('activities').select('*');

    // Apply filters
    if (ageMin !== undefined) {
      query = query.lte('age_min', ageMin);
    }

    if (ageMax !== undefined) {
      query = query.gte('age_max', ageMax);
    }

    if (maxDriveTime !== undefined) {
      query = query.lte('drive_time_minutes', maxDriveTime);
    }

    if (indoorOutdoor) {
      query = query.eq('indoor_outdoor', indoorOutdoor);
    }

    if (city) {
      query = query.eq('city', city);
    }

    // Sort by rating (descending, nulls last) and limit
    query = query
      .order('avg_rating', { ascending: false, nullsFirst: false })
      .limit(limit);

    // Execute query
    const { data: activities, error } = await query;

    if (error) {
      console.error('Query error:', error);
      return JSON.stringify({
        error: sanitizeError(error),
        data: null,
      });
    }

    // ========================================
    // Return Results
    // ========================================

    return JSON.stringify({
      activities: activities || [],
      count: activities?.length || 0,
      filters_applied: {
        age_min: ageMin,
        age_max: ageMax,
        max_drive_time: maxDriveTime,
        indoor_outdoor: indoorOutdoor,
        city: city,
        limit: limit,
      },
    }, null, 2);

  } catch (error) {
    console.error('Error in queryActivities:', error);
    return JSON.stringify({
      error: sanitizeError(error),
      data: null,
    });
  }
}

/**
 * Tool 2: suggest_activity_chain
 *
 * Main recommendation engine with multi-component scoring
 * Returns top N activity suggestions sorted by composite score
 *
 * @param args - SuggestActivityChainArgs with date and preferences
 * @returns JSON string with scored activity suggestions
 *
 * Security:
 * - Validates date format (YYYY-MM-DD)
 * - Whitelists weather condition
 * - Whitelists attendees
 * - Constrains num_suggestions
 */
export async function suggestActivityChain(args: SuggestActivityChainArgs): Promise<string> {
  try {
    // ========================================
    // Input Validation
    // ========================================

    // Validate date format
    if (!isValidDate(args.date)) {
      return JSON.stringify({
        error: 'Invalid date format. Must be YYYY-MM-DD (e.g., 2025-10-14)',
        data: null,
      });
    }

    // Validate num_suggestions (1-10, default 3)
    const numSuggestions = validateNumber(args.num_suggestions, 1, 10, 3);

    // Validate weather_condition (whitelist)
    let weatherCondition: string | undefined = undefined;
    if (args.weather_condition) {
      const normalized = args.weather_condition.toLowerCase().trim();
      if (ALLOWED_WEATHER.includes(normalized)) {
        weatherCondition = normalized;
      } else {
        return JSON.stringify({
          error: `Invalid weather condition. Allowed: ${ALLOWED_WEATHER.join(', ')}`,
          data: null,
        });
      }
    }

    // Validate attendees (whitelist)
    if (args.attendees) {
      for (const attendee of args.attendees) {
        if (!ALLOWED_ATTENDEES.includes(attendee)) {
          return JSON.stringify({
            error: `Invalid attendee value: ${attendee}. Allowed: ${ALLOWED_ATTENDEES.join(', ')}`,
            data: null,
          });
        }
      }
    }

    // ========================================
    // Query Activities and Visits
    // ========================================

    // Get all activities
    const { data: activities, error: activitiesError } = await supabase
      .from('activities')
      .select('*');

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      return JSON.stringify({
        error: sanitizeError(activitiesError),
        data: null,
      });
    }

    if (!activities || activities.length === 0) {
      return JSON.stringify({
        suggestions: [],
        count: 0,
        message: 'No activities found in database',
      });
    }

    // Get visit history for novelty scoring
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('activity_id, visited_at');

    if (visitsError) {
      console.error('Error fetching visits:', visitsError);
      // Continue with empty visits array
    }

    // Count visits per activity
    const visitCounts = new Map<string, number>();
    if (visits) {
      for (const visit of visits) {
        const count = visitCounts.get(visit.activity_id) || 0;
        visitCounts.set(visit.activity_id, count + 1);
      }
    }

    // ========================================
    // Score Activities
    // ========================================

    const scoredActivities: ScoredActivity[] = activities.map((activity) => {
      const visitsCount = visitCounts.get(activity.id) || 0;
      const { score, breakdown } = calculateActivityScore(
        activity,
        visitsCount,
        weatherCondition
      );

      return {
        ...activity,
        score,
        score_breakdown: breakdown,
      };
    });

    // ========================================
    // Sort and Return Top N
    // ========================================

    // Sort by score descending
    scoredActivities.sort((a, b) => b.score - a.score);

    // Take top N suggestions
    const topSuggestions = scoredActivities.slice(0, numSuggestions);

    return JSON.stringify({
      suggestions: topSuggestions,
      count: topSuggestions.length,
      total_activities_scored: scoredActivities.length,
      request_params: {
        date: args.date,
        num_suggestions: numSuggestions,
        weather_condition: weatherCondition,
        attendees: args.attendees,
      },
    }, null, 2);

  } catch (error) {
    console.error('Error in suggestActivityChain:', error);
    return JSON.stringify({
      error: sanitizeError(error),
      data: null,
    });
  }
}

/**
 * Tool 3: get_activity_details
 *
 * Get full details for a specific activity including visit history
 *
 * @param args - GetActivityDetailsArgs with activity_id
 * @returns JSON string with activity details and visit history
 *
 * Security: Validates UUID format before query
 */
export async function getActivityDetails(args: GetActivityDetailsArgs): Promise<string> {
  try {
    const { activity_id } = args;

    // Security: Validate UUID format before database query
    if (!isValidUUID(activity_id)) {
      return JSON.stringify({
        error: 'Invalid activity_id format',
        data: null,
      });
    }

    // Query activity by ID
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('*')
      .eq('id', activity_id)
      .single();

    // Handle query errors
    if (activityError) {
      console.error('Supabase error fetching activity:', activityError);
      return JSON.stringify({
        error: sanitizeError(activityError),
        data: null,
      });
    }

    // Handle activity not found
    if (!activity) {
      return JSON.stringify({
        error: 'Activity not found',
        data: null,
      });
    }

    // Query visit history for this activity
    const { data: visits, error: visitsError } = await supabase
      .from('visits')
      .select('*')
      .eq('activity_id', activity_id)
      .order('visited_at', { ascending: false });

    if (visitsError) {
      console.error('Error fetching visits:', visitsError);
      // Continue with empty visits
    }

    // Calculate aggregated visit stats
    const visitStats = {
      total_visits: visits?.length || 0,
      liked_by_3yo_count: visits?.filter(v => v.liked_by_3yo === true).length || 0,
      liked_by_5yo_count: visits?.filter(v => v.liked_by_5yo === true).length || 0,
      would_return_count: visits?.filter(v => v.would_return === true).length || 0,
      last_visit_date: visits?.[0]?.visited_at || null,
    };

    // Return full activity details with visit history
    return JSON.stringify({
      activity: activity,
      visit_history: visits || [],
      visit_stats: visitStats,
    }, null, 2);

  } catch (error) {
    console.error('Error in getActivityDetails:', error);
    return JSON.stringify({
      error: sanitizeError(error),
      data: null,
    });
  }
}

/**
 * Tool 4: check_opening_hours
 *
 * Check if activity is open at specified date/time
 *
 * v1 STUB: Returns placeholder message
 * Future: Integrate with Google Places API or activity-specific APIs
 *
 * @param args - CheckOpeningHoursArgs with activity_id, date, time
 * @returns JSON string with opening hours info
 */
export async function checkOpeningHours(args: CheckOpeningHoursArgs): Promise<string> {
  try {
    const { activity_id, date, time } = args;

    // Security: Validate UUID format
    if (!isValidUUID(activity_id)) {
      return JSON.stringify({
        error: 'Invalid activity_id format',
      });
    }

    // Validate date format
    if (!isValidDate(date)) {
      return JSON.stringify({
        error: 'Invalid date format. Must be YYYY-MM-DD',
      });
    }

    // v1 STUB: Return placeholder response
    return JSON.stringify({
      activity_id: activity_id,
      date: date,
      time: time || 'not specified',
      is_open: null,
      opening_time: null,
      closing_time: null,
      notes: 'Opening hours data not available in v1. Check activity website or call ahead.',
    }, null, 2);

  } catch (error) {
    console.error('Error in checkOpeningHours:', error);
    return JSON.stringify({
      error: sanitizeError(error),
    });
  }
}

// ============================================
// MCP Server Setup
// ============================================

const server = new Server(
  {
    name: 'weekend-planner-activity-planner',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ============================================
// Request Handlers
// ============================================

/**
 * List all available tools
 * Provides tool definitions for Claude Code to understand capabilities
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'query_activities',
        description:
          'Search and filter activities for kids. Returns activities sorted by rating. ' +
          'Filters: age range (0-18), drive time (0-180 min), indoor/outdoor type, city. ' +
          'Default limit: 10, max: 50.',
        inputSchema: {
          type: 'object',
          properties: {
            age_min: {
              type: 'number',
              description: 'Minimum age for activity (0-18). Filter: age_min <= this value.',
            },
            age_max: {
              type: 'number',
              description: 'Maximum age for activity (0-18). Filter: age_max >= this value.',
            },
            max_drive_time: {
              type: 'number',
              description: 'Maximum drive time in minutes (0-180).',
            },
            indoor_outdoor: {
              type: 'string',
              description: 'Filter by type: indoor, outdoor, or both.',
            },
            city: {
              type: 'string',
              description: 'Filter by city: Oakland, Berkeley, Walnut Creek, Lafayette, Orinda, SF.',
            },
            limit: {
              type: 'number',
              description: 'Number of results to return (default: 10, max: 50).',
            },
          },
          required: [],
        },
      },
      {
        name: 'suggest_activity_chain',
        description:
          'Main recommendation engine. Returns top N activity suggestions scored by 5 components: ' +
          'rating (40%), novelty (30%), drive time (20%), age match (5%), weather (5%). ' +
          'Each suggestion includes score breakdown showing contribution of each component.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'ISO date format (YYYY-MM-DD) for the activity day.',
            },
            num_suggestions: {
              type: 'number',
              description: 'Number of suggestions to return (default: 3, max: 10).',
            },
            weather_condition: {
              type: 'string',
              description: 'Weather condition: sunny, rainy, cold, hot, or mild.',
            },
            attendees: {
              type: 'array',
              items: { type: 'string' },
              description: 'Who is attending: 3yo, 5yo, or both. Default: both.',
            },
          },
          required: ['date'],
        },
      },
      {
        name: 'get_activity_details',
        description:
          'Get complete details for a specific activity by UUID. ' +
          'Returns activity info, full visit history, and aggregated visit statistics ' +
          '(total visits, liked by each kid, would return count, last visit date).',
        inputSchema: {
          type: 'object',
          properties: {
            activity_id: {
              type: 'string',
              description: 'UUID of the activity to retrieve.',
            },
          },
          required: ['activity_id'],
        },
      },
      {
        name: 'check_opening_hours',
        description:
          'Check if activity is open at specified date/time. ' +
          'v1 STUB: Returns placeholder message to check website. ' +
          'Future versions will integrate with Google Places API.',
        inputSchema: {
          type: 'object',
          properties: {
            activity_id: {
              type: 'string',
              description: 'UUID of the activity.',
            },
            date: {
              type: 'string',
              description: 'ISO date format (YYYY-MM-DD).',
            },
            time: {
              type: 'string',
              description: 'Optional time in HH:MM format (24-hour).',
            },
          },
          required: ['activity_id', 'date'],
        },
      },
    ],
  };
});

/**
 * Handle tool execution requests
 * Routes to appropriate tool function based on tool name
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case 'query_activities':
        result = await queryActivities(args as any as QueryActivitiesArgs);
        break;

      case 'suggest_activity_chain':
        result = await suggestActivityChain(args as any as SuggestActivityChainArgs);
        break;

      case 'get_activity_details':
        result = await getActivityDetails(args as any as GetActivityDetailsArgs);
        break;

      case 'check_opening_hours':
        result = await checkOpeningHours(args as any as CheckOpeningHoursArgs);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error executing tool ${name}:`, errorMessage);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: sanitizeError(error),
          }),
        },
      ],
      isError: true,
    };
  }
});

// ============================================
// Server Connection
// ============================================

/**
 * Start the MCP server on stdio transport
 * Logs to stderr to avoid interfering with stdio communication
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Activity Planner MCP server running on stdio');
}

// Start server and handle errors
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
