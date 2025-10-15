#!/usr/bin/env node

/**
 * Food Finder MCP Server
 *
 * Provides dietary-safe restaurant recommendations for Weekend Activity Planner.
 * All restaurant queries enforce family dietary restrictions:
 * - Celiac safe (gluten-free)
 * - Sesame-free options
 * - Cashew-free options
 * - Flax-free options
 *
 * Tools provided:
 * - find_restaurants: Search/filter restaurants with dietary constraints
 * - get_restaurant_details: Get full details for one restaurant
 * - check_dietary_safety: Explicit safety check for dietary restrictions
 * - match_restaurant_to_activity: Find restaurants near activities
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from project root (2 levels up from mcp-servers/food-finder/src/)
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
 * Restaurant record from Supabase
 * Maps to restaurants table schema
 */
interface Restaurant {
  id: string;
  name: string;
  cuisine: string | null;
  description: string | null;
  address: string | null;
  city: string;
  state: string | null;
  zip_code: string | null;
  latitude: number | null;
  longitude: number | null;
  drive_time_minutes: number | null;

  // Dietary restrictions (CRITICAL - always enforced)
  celiac_safe: boolean | null;
  celiac_notes: string | null;
  sesame_free_options: boolean | null;
  cashew_free_options: boolean | null;
  flax_free_options: boolean | null;
  allergen_notes: string | null;

  // Kid-friendliness
  kid_friendly: boolean | null;
  has_kids_menu: boolean | null;
  high_chairs_available: boolean | null;

  // Logistics
  opening_hours: Record<string, any> | null;
  price_range: string | null;
  avg_meal_cost: number | null;

  // Tracking
  times_visited: number | null;
  last_visited_at: string | null;
  avg_rating: number | null;

  // Contact
  yelp_url: string | null;
  google_maps_url: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  image_url: string | null;

  // Timestamps
  created_at: string | null;
  updated_at: string | null;
}

/**
 * Dietary safety assessment result
 * Used by check_dietary_safety tool
 */
interface DietarySafetyResult {
  is_safe: boolean;
  details: {
    celiac_safe: boolean;
    sesame_free: boolean;
    cashew_free: boolean;
    flax_free: boolean;
  };
  celiac_notes: string | null;
  allergen_notes: string | null;
  recommendation: 'SAFE' | 'CHECK_WITH_STAFF' | 'UNSAFE';
}

/**
 * Tool argument interfaces
 */
interface FindRestaurantsArgs {
  cuisine_preference?: string;
  max_drive_time?: number;
  near_activity_id?: string;
  limit?: number;
}

interface GetRestaurantDetailsArgs {
  restaurant_id: string;
}

interface CheckDietarySafetyArgs {
  restaurant_id: string;
}

interface MatchRestaurantToActivityArgs {
  activity_id: string;
  max_detour_minutes?: number;
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
 * Allowed cuisine types (whitelist)
 * Prevents SQL injection via cuisine parameter
 */
const ALLOWED_CUISINES = [
  'mexican',
  'italian',
  'american',
  'chinese',
  'japanese',
  'thai',
  'vietnamese',
  'indian',
  'mediterranean',
  'french',
  'greek',
  'korean',
  'ethiopian',
  'middle eastern',
  'pizza',
  'burgers',
  'sandwiches',
  'seafood',
  'bbq',
  'cafe',
  'breakfast',
  'brunch',
  'dessert',
  'ice cream',
];

/**
 * Validate cuisine preference against whitelist
 * Returns normalized cuisine if valid, null if invalid
 */
function validateCuisine(cuisine: string | undefined): string | null {
  if (!cuisine) return null;

  const normalized = cuisine.toLowerCase().trim();
  return ALLOWED_CUISINES.includes(normalized) ? normalized : null;
}

/**
 * Calculate drive time decay multiplier
 * Applies exponential penalty for restaurants beyond 30 minutes
 *
 * Formula: e^(-drive_time/30) for drive_time > 30
 * Rationale: With young kids, farther restaurants need higher ratings
 *
 * @param driveTimeMinutes - Drive time in minutes
 * @returns Decay multiplier (0-1)
 */
function calculateDriveTimeDecay(driveTimeMinutes: number | null): number {
  if (driveTimeMinutes === null || driveTimeMinutes <= 30) {
    return 1.0; // No penalty within 30 minutes
  }

  // Exponential decay: e^(-t/30)
  return Math.exp(-driveTimeMinutes / 30);
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
// Tool Implementations
// ============================================

/**
 * Get full details for a specific restaurant by ID
 *
 * Returns complete restaurant information including:
 * - Basic info (name, cuisine, description, address)
 * - Dietary safety flags and notes
 * - Kid-friendliness indicators
 * - Logistics (hours, pricing)
 * - Contact information
 * - Visit history and ratings
 *
 * @param args - GetRestaurantDetailsArgs with restaurant_id
 * @returns JSON string with restaurant details or error
 *
 * Security: Validates UUID format before query
 */
export async function getRestaurantDetails(args: GetRestaurantDetailsArgs): Promise<string> {
  try {
    const { restaurant_id } = args;

    // Security: Validate UUID format before database query
    if (!isValidUUID(restaurant_id)) {
      return JSON.stringify({
        error: 'Invalid restaurant_id format',
        data: null,
      });
    }

    // Query restaurant by ID
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurant_id)
      .single();

    // Handle query errors
    if (error) {
      console.error('Supabase error fetching restaurant:', error);
      return JSON.stringify({
        error: sanitizeError(error),
        data: null,
      });
    }

    // Handle restaurant not found
    if (!data) {
      return JSON.stringify({
        error: 'Restaurant not found',
        data: null,
      });
    }

    // Return full restaurant details
    return JSON.stringify({
      restaurant: data,
    });

  } catch (error) {
    console.error('Error in getRestaurantDetails:', error);
    return JSON.stringify({
      error: sanitizeError(error),
      data: null,
    });
  }
}

/**
 * Check dietary safety for a specific restaurant
 * Evaluates all family dietary restrictions (celiac, sesame, cashew, flax)
 *
 * Returns assessment of whether restaurant is safe for family's dietary needs:
 * - SAFE: All 4 dietary flags are true
 * - UNSAFE: One or more flags are false
 * - CHECK_WITH_STAFF: One or more flags are null (unknown)
 *
 * @param args - CheckDietarySafetyArgs with restaurant_id
 * @returns JSON string with dietary safety assessment
 *
 * Security: Validates UUID format before query
 */
export async function checkDietarySafety(args: CheckDietarySafetyArgs): Promise<string> {
  try {
    const { restaurant_id } = args;

    // Security: Validate UUID format before database query
    if (!isValidUUID(restaurant_id)) {
      return JSON.stringify({
        error: 'Invalid restaurant_id format. Must be a valid UUID.',
      });
    }

    // Query restaurant for dietary fields only
    const { data: restaurant, error } = await supabase
      .from('restaurants')
      .select(
        'celiac_safe, celiac_notes, sesame_free_options, cashew_free_options, flax_free_options, allergen_notes, name'
      )
      .eq('id', restaurant_id)
      .single();

    // Handle query errors
    if (error) {
      console.error('Supabase error checking dietary safety:', error);
      return JSON.stringify({
        error: sanitizeError(error),
      });
    }

    // Handle restaurant not found
    if (!restaurant) {
      return JSON.stringify({
        error: 'Restaurant not found',
      });
    }

    // Convert null dietary flags to false for safety evaluation
    const celiacSafe = restaurant.celiac_safe === true;
    const sesameFree = restaurant.sesame_free_options === true;
    const cashewFree = restaurant.cashew_free_options === true;
    const flaxFree = restaurant.flax_free_options === true;

    // Determine if restaurant is safe (all 4 flags must be true)
    const isSafe = celiacSafe && sesameFree && cashewFree && flaxFree;

    // Determine if any flags are null (need to check with staff)
    const hasNullFlags =
      restaurant.celiac_safe === null ||
      restaurant.sesame_free_options === null ||
      restaurant.cashew_free_options === null ||
      restaurant.flax_free_options === null;

    // Build recommendation based on flags
    let recommendation: 'SAFE' | 'CHECK_WITH_STAFF' | 'UNSAFE';
    if (isSafe) {
      recommendation = 'SAFE';
    } else if (hasNullFlags) {
      recommendation = 'CHECK_WITH_STAFF';
    } else {
      recommendation = 'UNSAFE';
    }

    // Build result object
    const result: DietarySafetyResult & { restaurant_name: string } = {
      restaurant_name: restaurant.name,
      is_safe: isSafe,
      details: {
        celiac_safe: celiacSafe,
        sesame_free: sesameFree,
        cashew_free: cashewFree,
        flax_free: flaxFree,
      },
      celiac_notes: restaurant.celiac_notes,
      allergen_notes: restaurant.allergen_notes,
      recommendation: recommendation,
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    console.error('Error in checkDietarySafety:', error);
    return JSON.stringify({
      error: sanitizeError(error),
    });
  }
}

/**
 * Find restaurants matching criteria with MANDATORY dietary filtering
 *
 * CRITICAL: ALL queries must enforce ALL 4 dietary restrictions:
 * - celiac_safe = true (gluten-free)
 * - sesame_free_options = true
 * - cashew_free_options = true
 * - flax_free_options = true
 *
 * Scoring algorithm:
 * - Base score = avg_rating (default 3.5 if unrated)
 * - Apply drive time decay for restaurants > 30 minutes away
 * - Sort by score descending
 *
 * @param args - FindRestaurantsArgs with optional filters
 * @returns JSON string with matching restaurants or error
 *
 * Security:
 * - Validates UUID format for near_activity_id
 * - Validates cuisine against whitelist
 * - Constrains numeric parameters
 * - Uses Supabase query builder (no raw SQL)
 */
export async function findRestaurants(args: FindRestaurantsArgs): Promise<string> {
  try {
    // ========================================
    // Input Validation
    // ========================================

    // Validate cuisine preference (optional)
    const cuisine = args.cuisine_preference
      ? validateCuisine(args.cuisine_preference)
      : null;

    // If cuisine provided but invalid, notify user
    if (args.cuisine_preference && !cuisine) {
      return JSON.stringify({
        error: `Invalid cuisine type: ${args.cuisine_preference}. Allowed types: ${ALLOWED_CUISINES.join(', ')}`,
        data: null,
      });
    }

    // Validate max_drive_time (default: 30 minutes, max: 120)
    const maxDriveTime = validateNumber(args.max_drive_time, 1, 120, 30);

    // Validate limit (default: 5, max: 20)
    const limit = validateNumber(args.limit, 1, 20, 5);

    // Validate near_activity_id if provided
    let nearActivityLocation: { latitude: number; longitude: number } | null = null;

    if (args.near_activity_id) {
      if (!isValidUUID(args.near_activity_id)) {
        return JSON.stringify({
          error: 'Invalid activity ID format',
          data: null,
        });
      }

      // Query activity location
      const { data: activity, error: activityError } = await supabase
        .from('activities')
        .select('latitude, longitude')
        .eq('id', args.near_activity_id)
        .single();

      if (activityError) {
        console.error('Error fetching activity location:', activityError);
        return JSON.stringify({
          error: 'Activity not found',
          data: null,
        });
      }

      if (activity && activity.latitude && activity.longitude) {
        nearActivityLocation = {
          latitude: activity.latitude,
          longitude: activity.longitude,
        };
      }
    }

    // ========================================
    // Query Restaurants
    // ========================================

    // Start query with MANDATORY dietary filters
    // SECURITY: These filters are NEVER optional - they protect family safety
    let query = supabase
      .from('restaurants')
      .select('*')
      .eq('celiac_safe', true)
      .eq('sesame_free_options', true)
      .eq('cashew_free_options', true)
      .eq('flax_free_options', true);

    // Apply cuisine filter if specified
    if (cuisine) {
      query = query.ilike('cuisine', cuisine);
    }

    // Apply drive time filter
    query = query.lte('drive_time_minutes', maxDriveTime);

    // Execute query
    const { data: restaurants, error: queryError } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return JSON.stringify({
        error: sanitizeError(queryError),
        data: null,
      });
    }

    if (!restaurants || restaurants.length === 0) {
      return JSON.stringify({
        restaurants: [],
        count: 0,
        message: 'No dietary-safe restaurants found matching criteria',
        filters_applied: {
          cuisine: cuisine ?? 'any',
          max_drive_time: maxDriveTime,
          near_activity: args.near_activity_id ?? null,
          dietary_restrictions: {
            celiac_safe: true,
            sesame_free: true,
            cashew_free: true,
            flax_free: true,
          },
        },
      });
    }

    // ========================================
    // Score and Sort Results
    // ========================================

    // Calculate score for each restaurant
    // Score = avg_rating (or 3.5 default) * drive_time_decay_multiplier
    const scoredRestaurants = restaurants.map((restaurant: Restaurant) => {
      const rating = restaurant.avg_rating ?? 3.5; // Default to 3.5 if no rating
      const driveTime = restaurant.drive_time_minutes ?? 30;
      const decayMultiplier = calculateDriveTimeDecay(driveTime);
      const score = rating * decayMultiplier;

      return {
        ...restaurant,
        score: Math.round(score * 100) / 100, // Round to 2 decimals
      };
    });

    // Sort by score descending
    scoredRestaurants.sort((a, b) => b.score - a.score);

    // Apply limit
    const topRestaurants = scoredRestaurants.slice(0, limit);

    // ========================================
    // Return Results
    // ========================================

    return JSON.stringify({
      restaurants: topRestaurants,
      count: topRestaurants.length,
      total_matching: restaurants.length,
      filters_applied: {
        cuisine: cuisine ?? 'any',
        max_drive_time: maxDriveTime,
        near_activity: args.near_activity_id ?? null,
        dietary_restrictions: {
          celiac_safe: true,
          sesame_free: true,
          cashew_free: true,
          flax_free: true,
        },
      },
    });
  } catch (error) {
    console.error('findRestaurants error:', error);
    return JSON.stringify({
      error: sanitizeError(error),
      data: null,
    });
  }
}

/**
 * Match restaurants to a specific activity
 * Finds dietary-safe restaurants near the activity location
 *
 * Algorithm:
 * 1. Look up activity details (city, drive time)
 * 2. Find restaurants that are:
 *    - Same city as activity (preferred) OR
 *    - Within acceptable detour distance
 * 3. Calculate proximity score:
 *    - Same city gets highest score (1.0)
 *    - Nearby cities get lower score based on drive time difference
 * 4. Return top matches sorted by proximity score
 *
 * @param args.activity_id - UUID of activity to match restaurants to
 * @param args.max_detour_minutes - Maximum additional drive time beyond activity (default 15)
 * @returns JSON string with activity details and matched restaurants
 *
 * Security: Validates UUID format before query
 */
export async function matchRestaurantToActivity(args: MatchRestaurantToActivityArgs): Promise<string> {
  try {
    // Validate activity_id
    if (!isValidUUID(args.activity_id)) {
      return JSON.stringify({
        error: 'Invalid activity_id format. Must be a valid UUID.',
        activity_id: args.activity_id,
      });
    }

    // Validate and constrain max_detour_minutes
    const maxDetourMinutes = validateNumber(args.max_detour_minutes, 0, 60, 15);

    // Step 1: Get activity details
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, name, city, drive_time_minutes')
      .eq('id', args.activity_id)
      .single();

    if (activityError || !activity) {
      console.error('Supabase error fetching activity:', activityError);
      return JSON.stringify({
        error: 'Activity not found',
        activity_id: args.activity_id,
      });
    }

    // Step 2: Query all dietary-safe restaurants
    const { data: restaurants, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('celiac_safe', true)
      .eq('sesame_free_options', true)
      .eq('cashew_free_options', true)
      .eq('flax_free_options', true);

    if (restaurantError) {
      console.error('Supabase error fetching restaurants:', restaurantError);
      return JSON.stringify({
        error: sanitizeError(restaurantError),
      });
    }

    if (!restaurants || restaurants.length === 0) {
      return JSON.stringify({
        activity: {
          id: activity.id,
          name: activity.name,
          city: activity.city,
          drive_time_minutes: activity.drive_time_minutes,
        },
        restaurants: [],
        count: 0,
        message: 'No dietary-safe restaurants found',
      });
    }

    // Step 3: Filter and score restaurants
    interface ScoredRestaurant extends Restaurant {
      proximity_score: number;
      same_city: boolean;
      drive_time_difference?: number;
    }

    const activityDriveTime = activity.drive_time_minutes ?? 0;
    const maxDriveTime = activityDriveTime + maxDetourMinutes;

    const scoredRestaurants: ScoredRestaurant[] = restaurants
      .map((restaurant) => {
        const restaurantDriveTime = restaurant.drive_time_minutes ?? 0;
        const sameCity = restaurant.city.toLowerCase() === activity.city.toLowerCase();

        // Calculate proximity score
        let proximityScore = 0;

        if (sameCity) {
          // Same city gets highest score (1.0)
          proximityScore = 1.0;
        } else if (restaurantDriveTime <= maxDriveTime) {
          // Nearby cities: score based on drive time difference
          // Closer = higher score
          // Formula: 1 - (drive_time_diff / max_detour)
          const driveTimeDiff = Math.abs(restaurantDriveTime - activityDriveTime);
          proximityScore = Math.max(0, 1 - (driveTimeDiff / (maxDetourMinutes * 2)));
        } else {
          // Too far - filter out by returning null
          return null;
        }

        return {
          ...restaurant,
          proximity_score: proximityScore,
          same_city: sameCity,
          drive_time_difference: sameCity ? 0 : Math.abs(restaurantDriveTime - activityDriveTime),
        };
      })
      .filter((r): r is ScoredRestaurant => r !== null); // Remove null entries

    // Step 4: Sort by proximity score (descending) and return top 3-5
    const topRestaurants = scoredRestaurants
      .sort((a, b) => {
        // Primary: proximity_score (higher is better)
        if (b.proximity_score !== a.proximity_score) {
          return b.proximity_score - a.proximity_score;
        }
        // Secondary: avg_rating (higher is better)
        const ratingA = a.avg_rating ?? 0;
        const ratingB = b.avg_rating ?? 0;
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        // Tertiary: times_visited (higher is better - we know the family likes it)
        const visitsA = a.times_visited ?? 0;
        const visitsB = b.times_visited ?? 0;
        return visitsB - visitsA;
      })
      .slice(0, 5); // Top 5 matches

    // Step 5: Format response
    return JSON.stringify({
      activity: {
        id: activity.id,
        name: activity.name,
        city: activity.city,
        drive_time_minutes: activity.drive_time_minutes,
      },
      restaurants: topRestaurants.map(r => ({
        id: r.id,
        name: r.name,
        cuisine: r.cuisine,
        city: r.city,
        address: r.address,
        drive_time_minutes: r.drive_time_minutes,
        proximity_score: Math.round(r.proximity_score * 100) / 100, // Round to 2 decimals
        same_city: r.same_city,
        drive_time_difference: r.drive_time_difference,

        // Dietary safety info
        celiac_safe: r.celiac_safe,
        celiac_notes: r.celiac_notes,
        sesame_free_options: r.sesame_free_options,
        cashew_free_options: r.cashew_free_options,
        flax_free_options: r.flax_free_options,
        allergen_notes: r.allergen_notes,

        // Kid-friendliness
        kid_friendly: r.kid_friendly,
        has_kids_menu: r.has_kids_menu,

        // Ratings and visits
        avg_rating: r.avg_rating,
        times_visited: r.times_visited,
        last_visited_at: r.last_visited_at,

        // Contact info
        google_maps_url: r.google_maps_url,
        yelp_url: r.yelp_url,
        phone: r.phone,
        website: r.website,

        // Price
        price_range: r.price_range,
        avg_meal_cost: r.avg_meal_cost,
      })),
      count: topRestaurants.length,
      search_params: {
        activity_id: args.activity_id,
        max_detour_minutes: maxDetourMinutes,
        max_drive_time: maxDriveTime,
      },
    }, null, 2);
  } catch (error) {
    console.error('Error in matchRestaurantToActivity:', error);
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
    name: 'weekend-planner-food-finder',
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
        name: 'find_restaurants',
        description:
          'Search for dietary-safe restaurants with optional filters. ' +
          'ALWAYS enforces family dietary restrictions: celiac-safe, sesame-free, cashew-free, flax-free. ' +
          'Returns restaurants sorted by rating × drive_time_decay.',
        inputSchema: {
          type: 'object',
          properties: {
            cuisine_preference: {
              type: 'string',
              description:
                'Filter by cuisine type (mexican, italian, american, chinese, etc.). Case-insensitive.',
            },
            max_drive_time: {
              type: 'number',
              description:
                'Maximum drive time in minutes (default: 30). Restaurants beyond 30 minutes get exponential penalty.',
            },
            near_activity_id: {
              type: 'string',
              description:
                'UUID of activity to find nearby restaurants. Filters by proximity to activity location.',
            },
            limit: {
              type: 'number',
              description: 'Number of results to return (default: 5, max: 20)',
            },
          },
          required: [],
        },
      },
      {
        name: 'get_restaurant_details',
        description:
          'Get complete details for a specific restaurant by UUID. ' +
          'Returns all information including dietary safety flags, hours, contact info, ratings.',
        inputSchema: {
          type: 'object',
          properties: {
            restaurant_id: {
              type: 'string',
              description: 'UUID of the restaurant to retrieve',
            },
          },
          required: ['restaurant_id'],
        },
      },
      {
        name: 'check_dietary_safety',
        description:
          'Check if a restaurant is safe for family dietary restrictions. ' +
          'Evaluates celiac (gluten-free), sesame, cashew, and flax restrictions. ' +
          'Returns SAFE, UNSAFE, or CHECK_WITH_STAFF recommendation.',
        inputSchema: {
          type: 'object',
          properties: {
            restaurant_id: {
              type: 'string',
              description: 'UUID of the restaurant to check',
            },
          },
          required: ['restaurant_id'],
        },
      },
      {
        name: 'match_restaurant_to_activity',
        description:
          'Find dietary-safe restaurants near a specific activity. ' +
          'Returns top 3-5 restaurants sorted by proximity score. ' +
          'Prioritizes same-city restaurants, then nearby within acceptable detour.',
        inputSchema: {
          type: 'object',
          properties: {
            activity_id: {
              type: 'string',
              description: 'UUID of the activity to match restaurants to',
            },
            max_detour_minutes: {
              type: 'number',
              description:
                'Maximum additional drive time beyond activity drive time (default: 15 minutes)',
            },
          },
          required: ['activity_id'],
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
      case 'find_restaurants':
        result = await findRestaurants(args as any as FindRestaurantsArgs);
        break;

      case 'get_restaurant_details':
        result = await getRestaurantDetails(args as any as GetRestaurantDetailsArgs);
        break;

      case 'check_dietary_safety':
        result = await checkDietarySafety(args as any as CheckDietarySafetyArgs);
        break;

      case 'match_restaurant_to_activity':
        result = await matchRestaurantToActivity(args as any as MatchRestaurantToActivityArgs);
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
  console.error('Food Finder MCP server running on stdio');
}

// Start server and handle errors
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
