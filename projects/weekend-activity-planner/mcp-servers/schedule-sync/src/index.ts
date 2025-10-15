#!/usr/bin/env node

/**
 * Schedule Sync MCP Server
 *
 * Provides scheduling, weather, and logistics coordination for Weekend Activity Planner.
 * Handles:
 * - Calendar conflict checking (v1 stub, v2 Google Calendar)
 * - Weather forecasting via Weather.gov API (FREE, no API key)
 * - Drive time calculations (database lookups + estimates)
 * - Timing suggestions (combines weather, drive time, activity details)
 *
 * Tools provided:
 * - check_calendar_conflicts: Check for calendar conflicts (v1 stub)
 * - get_weather_forecast: Fetch real weather forecast from Weather.gov
 * - calculate_drive_time: Calculate drive time between locations
 * - suggest_timing: Suggest optimal timing for an activity
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables from project root (2 levels up from mcp-servers/schedule-sync/src/)
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
// Constants
// ============================================

/**
 * Home coordinates (Oakland Montclair)
 * Used for drive time calculations
 */
const HOME_COORDS = { lat: 37.8324, lon: -122.2128 };

/**
 * City coordinates for weather lookups
 * Maps city names to lat/lon for Weather.gov API
 */
const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
  'Oakland': { lat: 37.8044, lon: -122.2712 },
  'Berkeley': { lat: 37.8715, lon: -122.2730 },
  'Walnut Creek': { lat: 37.9101, lon: -122.0652 },
  'Lafayette': { lat: 37.8857, lon: -122.1180 },
  'Orinda': { lat: 37.8771, lon: -122.1797 },
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  'SF': { lat: 37.7749, lon: -122.4194 },
};

/**
 * Allowed city names (whitelist for security)
 */
const ALLOWED_CITIES = [
  'Oakland',
  'Berkeley',
  'Walnut Creek',
  'Lafayette',
  'Orinda',
  'San Francisco',
  'SF',
];

/**
 * Drive time estimates for city-to-city travel (minutes)
 * Used when database lookups don't provide direct info
 */
const CITY_DRIVE_ESTIMATES: Record<string, number> = {
  'Oakland->Berkeley': 20,
  'Oakland->Walnut Creek': 35,
  'Oakland->Lafayette': 30,
  'Oakland->Orinda': 25,
  'Oakland->SF': 30,
  'Oakland->San Francisco': 30,
  'Berkeley->SF': 25,
  'Berkeley->San Francisco': 25,
  'Berkeley->Oakland': 20,
  'Berkeley->Walnut Creek': 40,
  'Walnut Creek->Oakland': 35,
  'Walnut Creek->Berkeley': 40,
  'Lafayette->Oakland': 30,
  'Orinda->Oakland': 25,
  'SF->Oakland': 30,
  'San Francisco->Oakland': 30,
  'SF->Berkeley': 25,
  'San Francisco->Berkeley': 25,
};

// ============================================
// Type Definitions
// ============================================

/**
 * Tool argument interfaces
 */
interface CheckCalendarConflictsArgs {
  start_date: string;  // YYYY-MM-DD
  end_date: string;    // YYYY-MM-DD
  time_range?: {
    start: string;     // HH:MM
    end: string;       // HH:MM
  };
}

interface GetWeatherForecastArgs {
  date: string;        // YYYY-MM-DD
  city: string;        // 'Oakland' | 'Berkeley' | etc.
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface CalculateDriveTimeArgs {
  from_location: string;  // 'home' | activity_id (UUID) | city name
  to_location: string;    // activity_id (UUID) | city name
}

interface SuggestTimingArgs {
  activity_id: string;
  date: string;
}

/**
 * Weather forecast result
 */
interface WeatherForecastResult {
  date: string;
  city: string;
  condition: string;      // 'sunny' | 'rainy' | 'cloudy' | 'cold' | 'hot' | 'mild'
  temperature_high: number | null;
  temperature_low: number | null;
  precipitation_chance: number | null;
  summary: string;
  source: string;
}

/**
 * Drive time result
 */
interface DriveTimeResult {
  drive_time_minutes: number;
  from: string;
  to: string;
  source: string;  // 'database' | 'estimated' | 'fallback'
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
 * Date validation regex (YYYY-MM-DD)
 */
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate date format
 * Returns true if valid YYYY-MM-DD format and parseable
 */
function isValidDate(date: string): boolean {
  if (!DATE_REGEX.test(date)) return false;
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Time validation regex (HH:MM)
 */
const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validate time format
 * Returns true if valid HH:MM format (24-hour)
 */
function isValidTime(time: string): boolean {
  return TIME_REGEX.test(time);
}

/**
 * Validate city name against whitelist
 * Returns normalized city if valid, null if invalid
 */
function validateCity(city: string): string | null {
  const normalized = city.trim();
  return ALLOWED_CITIES.includes(normalized) ? normalized : null;
}

/**
 * Validate coordinate ranges
 * Oakland/East Bay area: lat 36-39, lon -123 to -121
 */
function isValidCoordinate(lat: number, lon: number): boolean {
  return lat >= 36 && lat <= 39 && lon >= -123 && lon <= -121;
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

// ============================================
// Weather Utilities
// ============================================

/**
 * Map Weather.gov shortForecast to our condition categories
 * Returns: 'sunny' | 'rainy' | 'cloudy' | 'cold' | 'hot' | 'mild'
 */
function mapWeatherCondition(shortForecast: string, temperature: number | null): string {
  const lower = shortForecast.toLowerCase();

  // Check for rain/precipitation first
  if (lower.includes('rain') || lower.includes('shower') || lower.includes('storm')) {
    return 'rainy';
  }

  // Check for clear/sunny
  if (lower.includes('sun') || lower.includes('clear')) {
    return 'sunny';
  }

  // Check for cloudy
  if (lower.includes('cloud') || lower.includes('overcast')) {
    return 'cloudy';
  }

  // Temperature-based conditions
  if (temperature !== null) {
    if (temperature >= 85) return 'hot';
    if (temperature <= 45) return 'cold';
  }

  // Default
  return 'mild';
}

// ============================================
// Tool Implementations
// ============================================

/**
 * Check for calendar conflicts (v1 stub)
 *
 * v1: Returns no conflicts with note to check calendar manually
 * v2: Will integrate with Google Calendar API
 *
 * @param args - CheckCalendarConflictsArgs
 * @returns JSON string with conflict status
 *
 * Security: Validates date and time formats
 */
export async function checkCalendarConflicts(args: CheckCalendarConflictsArgs): Promise<string> {
  try {
    // Validate dates
    if (!isValidDate(args.start_date)) {
      return JSON.stringify({
        error: 'Invalid start_date format. Must be YYYY-MM-DD.',
      });
    }

    if (!isValidDate(args.end_date)) {
      return JSON.stringify({
        error: 'Invalid end_date format. Must be YYYY-MM-DD.',
      });
    }

    // Validate time range if provided
    if (args.time_range) {
      if (!isValidTime(args.time_range.start)) {
        return JSON.stringify({
          error: 'Invalid time_range.start format. Must be HH:MM (24-hour).',
        });
      }

      if (!isValidTime(args.time_range.end)) {
        return JSON.stringify({
          error: 'Invalid time_range.end format. Must be HH:MM (24-hour).',
        });
      }
    }

    // v1 stub - always return no conflicts
    return JSON.stringify({
      has_conflicts: false,
      conflicts: [],
      note: 'Calendar integration not available in v1. Check your calendar manually.',
      date_range: {
        start: args.start_date,
        end: args.end_date,
      },
      time_range: args.time_range || null,
    }, null, 2);

  } catch (error) {
    console.error('Error in checkCalendarConflicts:', error);
    return JSON.stringify({
      error: sanitizeError(error),
    });
  }
}

/**
 * Get weather forecast using Weather.gov API (FREE, no API key needed)
 *
 * Fetches real weather data from NOAA's Weather.gov API
 * Maps forecast to our condition categories
 *
 * @param args - GetWeatherForecastArgs
 * @returns JSON string with weather forecast
 *
 * Security:
 * - Validates date format
 * - Validates city against whitelist
 * - Validates coordinate ranges
 * - 5 second timeout on API calls
 */
export async function getWeatherForecast(args: GetWeatherForecastArgs): Promise<string> {
  try {
    // Validate date
    if (!isValidDate(args.date)) {
      return JSON.stringify({
        error: 'Invalid date format. Must be YYYY-MM-DD.',
      });
    }

    // Get coordinates (from args or city lookup)
    let coords: { lat: number; lon: number } | null = null;

    if (args.coordinates) {
      // Validate provided coordinates
      if (!isValidCoordinate(args.coordinates.latitude, args.coordinates.longitude)) {
        return JSON.stringify({
          error: 'Invalid coordinates. Must be in Oakland/East Bay area (lat: 36-39, lon: -123 to -121).',
        });
      }
      coords = { lat: args.coordinates.latitude, lon: args.coordinates.longitude };
    } else {
      // Validate city and lookup coordinates
      const validCity = validateCity(args.city);
      if (!validCity) {
        return JSON.stringify({
          error: `Invalid city: ${args.city}. Allowed cities: ${ALLOWED_CITIES.join(', ')}`,
        });
      }

      coords = CITY_COORDS[validCity];
      if (!coords) {
        return JSON.stringify({
          error: `No coordinates found for city: ${validCity}`,
        });
      }
    }

    // Step 1: Call Weather.gov Points API to get forecast URL
    const pointsUrl = `https://api.weather.gov/points/${coords.lat},${coords.lon}`;

    const pointsController = new AbortController();
    const pointsTimeout = setTimeout(() => pointsController.abort(), 5000);

    let pointsResponse: Response;
    try {
      pointsResponse = await fetch(pointsUrl, {
        headers: { 'User-Agent': 'WeekendActivityPlanner/1.0' },
        signal: pointsController.signal,
      });
      clearTimeout(pointsTimeout);
    } catch (error: any) {
      clearTimeout(pointsTimeout);
      if (error.name === 'AbortError') {
        return JSON.stringify({
          error: 'Weather API request timed out',
          fallback: {
            condition: 'mild',
            note: 'Using fallback due to API timeout',
          },
        });
      }
      throw error;
    }

    if (!pointsResponse.ok) {
      console.error('Weather.gov Points API error:', pointsResponse.status);
      return JSON.stringify({
        error: 'Weather service unavailable',
        fallback: {
          condition: 'mild',
          note: 'Using fallback due to API error',
        },
      });
    }

    const pointsData = await pointsResponse.json();
    const forecastUrl = pointsData.properties?.forecast;

    if (!forecastUrl) {
      return JSON.stringify({
        error: 'No forecast URL available from Weather.gov',
        fallback: {
          condition: 'mild',
          note: 'Using fallback',
        },
      });
    }

    // Step 2: Get forecast data
    const forecastController = new AbortController();
    const forecastTimeout = setTimeout(() => forecastController.abort(), 5000);

    let forecastResponse: Response;
    try {
      forecastResponse = await fetch(forecastUrl, {
        headers: { 'User-Agent': 'WeekendActivityPlanner/1.0' },
        signal: forecastController.signal,
      });
      clearTimeout(forecastTimeout);
    } catch (error: any) {
      clearTimeout(forecastTimeout);
      if (error.name === 'AbortError') {
        return JSON.stringify({
          error: 'Weather forecast request timed out',
          fallback: {
            condition: 'mild',
            note: 'Using fallback due to API timeout',
          },
        });
      }
      throw error;
    }

    if (!forecastResponse.ok) {
      console.error('Weather.gov Forecast API error:', forecastResponse.status);
      return JSON.stringify({
        error: 'Forecast data unavailable',
        fallback: {
          condition: 'mild',
          note: 'Using fallback due to API error',
        },
      });
    }

    const forecastData = await forecastResponse.json();
    const periods = forecastData.properties?.periods;

    if (!periods || periods.length === 0) {
      return JSON.stringify({
        error: 'No forecast periods available',
        fallback: {
          condition: 'mild',
          note: 'Using fallback',
        },
      });
    }

    // Step 3: Find forecast for target date
    const targetDate = new Date(args.date);
    targetDate.setHours(12, 0, 0, 0); // Set to noon for comparison

    let forecast = periods.find((p: any) => {
      const periodDate = new Date(p.startTime);
      return periodDate.toDateString() === targetDate.toDateString() && p.isDaytime;
    });

    // If exact match not found, find the closest daytime period
    if (!forecast) {
      forecast = periods.find((p: any) => p.isDaytime);
    }

    if (!forecast) {
      return JSON.stringify({
        error: 'No daytime forecast available for this date',
        fallback: {
          condition: 'mild',
          note: 'Forecast may be too far in future (Weather.gov provides ~7 days)',
        },
      });
    }

    // Step 4: Map to our condition categories
    const condition = mapWeatherCondition(
      forecast.shortForecast,
      forecast.temperature
    );

    // Step 5: Build result
    const result: WeatherForecastResult = {
      date: args.date,
      city: args.city,
      condition,
      temperature_high: forecast.temperature || null,
      temperature_low: null,  // Would need nighttime period for this
      precipitation_chance: forecast.probabilityOfPrecipitation?.value || null,
      summary: forecast.detailedForecast || forecast.shortForecast,
      source: 'weather.gov',
    };

    return JSON.stringify(result, null, 2);

  } catch (error) {
    console.error('Error in getWeatherForecast:', error);
    return JSON.stringify({
      error: sanitizeError(error),
      fallback: {
        condition: 'mild',
        note: 'Using fallback due to unexpected error',
      },
    });
  }
}

/**
 * Calculate drive time between locations
 *
 * Supports:
 * - home -> activity (database lookup)
 * - city -> city (estimates)
 * - activity -> activity (database lookups + haversine estimate)
 *
 * @param args - CalculateDriveTimeArgs
 * @returns JSON string with drive time
 *
 * Security: Validates UUIDs and city names
 */
export async function calculateDriveTime(args: CalculateDriveTimeArgs): Promise<string> {
  try {
    const { from_location, to_location } = args;

    // Case 1: home -> activity (look up activity.drive_time_minutes)
    if (from_location.toLowerCase() === 'home' && isValidUUID(to_location)) {
      const { data: activity, error } = await supabase
        .from('activities')
        .select('name, drive_time_minutes')
        .eq('id', to_location)
        .single();

      if (error || !activity) {
        return JSON.stringify({
          error: 'Activity not found',
          drive_time_minutes: 30,  // Fallback
          source: 'fallback',
        });
      }

      const result: DriveTimeResult = {
        drive_time_minutes: activity.drive_time_minutes ?? 30,
        from: 'home',
        to: activity.name,
        source: 'database',
      };

      return JSON.stringify(result, null, 2);
    }

    // Case 2: activity -> activity (both are UUIDs)
    if (isValidUUID(from_location) && isValidUUID(to_location)) {
      const { data: activities, error } = await supabase
        .from('activities')
        .select('id, name, drive_time_minutes')
        .in('id', [from_location, to_location]);

      if (error || !activities || activities.length !== 2) {
        return JSON.stringify({
          error: 'One or both activities not found',
          drive_time_minutes: 30,  // Fallback
          source: 'fallback',
        });
      }

      const fromActivity = activities.find(a => a.id === from_location);
      const toActivity = activities.find(a => a.id === to_location);

      // Estimate: average of their drive times from home + 10 minutes
      const estimate = Math.round(
        ((fromActivity?.drive_time_minutes ?? 30) +
         (toActivity?.drive_time_minutes ?? 30)) / 2 + 10
      );

      const result: DriveTimeResult = {
        drive_time_minutes: estimate,
        from: fromActivity?.name ?? from_location,
        to: toActivity?.name ?? to_location,
        source: 'estimated',
      };

      return JSON.stringify(result, null, 2);
    }

    // Case 3: city -> city (estimates)
    const fromCity = validateCity(from_location);
    const toCity = validateCity(to_location);

    if (!fromCity || !toCity) {
      return JSON.stringify({
        error: `Invalid city name(s). Allowed cities: ${ALLOWED_CITIES.join(', ')}`,
        drive_time_minutes: 30,
        source: 'fallback',
      });
    }

    // Look up estimate (try both directions)
    const key = `${fromCity}->${toCity}`;
    const reverseKey = `${toCity}->${fromCity}`;
    const estimate = CITY_DRIVE_ESTIMATES[key] ?? CITY_DRIVE_ESTIMATES[reverseKey] ?? 30;

    const result: DriveTimeResult = {
      drive_time_minutes: estimate,
      from: fromCity,
      to: toCity,
      source: 'estimated',
    };

    return JSON.stringify(result, null, 2);

  } catch (error) {
    console.error('Error in calculateDriveTime:', error);
    return JSON.stringify({
      error: sanitizeError(error),
      drive_time_minutes: 30,
      source: 'fallback',
    });
  }
}

/**
 * Suggest optimal timing for an activity
 *
 * Combines:
 * - Activity details (from database)
 * - Weather forecast
 * - Drive time
 *
 * Returns suggested start/end times with reasoning
 *
 * @param args - SuggestTimingArgs
 * @returns JSON string with timing suggestion
 *
 * Security: Validates UUID and date formats
 */
export async function suggestTiming(args: SuggestTimingArgs): Promise<string> {
  try {
    // Validate activity_id
    if (!isValidUUID(args.activity_id)) {
      return JSON.stringify({
        error: 'Invalid activity_id format. Must be a valid UUID.',
      });
    }

    // Validate date
    if (!isValidDate(args.date)) {
      return JSON.stringify({
        error: 'Invalid date format. Must be YYYY-MM-DD.',
      });
    }

    // Step 1: Get activity details
    const { data: activity, error: activityError } = await supabase
      .from('activities')
      .select('id, name, city, drive_time_minutes, indoor_outdoor')
      .eq('id', args.activity_id)
      .single();

    if (activityError || !activity) {
      return JSON.stringify({
        error: 'Activity not found',
      });
    }

    // Step 2: Get weather (internal call)
    const weatherResult = await getWeatherForecast({
      date: args.date,
      city: activity.city,
    });

    let weather: any = null;
    try {
      const weatherParsed = JSON.parse(weatherResult);
      weather = weatherParsed.error ? null : weatherParsed;
    } catch {
      weather = null;
    }

    // Step 3: Get drive time (internal call)
    const driveResult = await calculateDriveTime({
      from_location: 'home',
      to_location: args.activity_id,
    });

    let driveTime = 30;  // Default
    try {
      const driveParsed = JSON.parse(driveResult);
      driveTime = driveParsed.drive_time_minutes ?? 30;
    } catch {
      driveTime = 30;
    }

    // Step 4: Calculate timing
    const reasoning: string[] = [];
    let startHour = 10;  // Default: 10am start
    let startMinute = 0;

    // Adjust for weather
    if (weather) {
      if (weather.condition === 'hot') {
        startHour = 9;
        reasoning.push('Starting earlier (9am) to avoid afternoon heat');
      } else if (weather.condition === 'rainy' && activity.indoor_outdoor === 'outdoor') {
        startHour = 11;
        reasoning.push('Starting later (11am) in case rain clears');
      } else if (weather.condition === 'cold') {
        startHour = 11;
        reasoning.push('Starting later (11am) to let morning warm up');
      }
    }

    // Adjust for drive time
    if (driveTime > 45) {
      if (startHour > 9) {
        startHour = 9;
        reasoning.push(`Starting earlier (9am) due to ${driveTime}-minute drive`);
      } else {
        reasoning.push(`Note: ${driveTime}-minute drive - plan accordingly`);
      }
    }

    // Duration: 2.5 hours typical
    const durationHours = 2.5;
    const endHour = startHour + Math.floor(durationHours);
    const endMinute = (durationHours % 1) * 60;

    // Lunch consideration
    if (startHour >= 11 && startHour < 13) {
      reasoning.push('Activity spans lunch time - plan to eat during or after');
    } else if (endHour >= 12 && endHour < 14) {
      reasoning.push('Activity ends around lunch - plan meal afterward');
    }

    // Weekend pattern recommendation
    if (!reasoning.length) {
      reasoning.push('Standard weekend morning timing');
    }

    // Step 5: Format response
    return JSON.stringify({
      activity: {
        id: activity.id,
        name: activity.name,
        city: activity.city,
      },
      suggested_start: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
      suggested_end: `${String(endHour).padStart(2, '0')}:${String(Math.floor(endMinute)).padStart(2, '0')}`,
      reasoning,
      weather: weather ? {
        condition: weather.condition,
        temperature_high: weather.temperature_high,
        precipitation_chance: weather.precipitation_chance,
        summary: weather.summary,
      } : null,
      drive_time_minutes: driveTime,
      opening_hours: {
        is_open: null,
        note: 'Opening hours not available in v1',
      },
    }, null, 2);

  } catch (error) {
    console.error('Error in suggestTiming:', error);
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
    name: 'weekend-planner-schedule-sync',
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
        name: 'check_calendar_conflicts',
        description:
          'Check for calendar conflicts in a date range. ' +
          'v1: Returns stub (no conflicts). v2 will integrate Google Calendar. ' +
          'Use to verify availability before suggesting activities.',
        inputSchema: {
          type: 'object',
          properties: {
            start_date: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format',
            },
            end_date: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format',
            },
            time_range: {
              type: 'object',
              description: 'Optional time range to check',
              properties: {
                start: {
                  type: 'string',
                  description: 'Start time in HH:MM format (24-hour)',
                },
                end: {
                  type: 'string',
                  description: 'End time in HH:MM format (24-hour)',
                },
              },
            },
          },
          required: ['start_date', 'end_date'],
        },
      },
      {
        name: 'get_weather_forecast',
        description:
          'Get real weather forecast from Weather.gov (NOAA). ' +
          'Returns condition (sunny/rainy/cloudy/hot/cold/mild), temperature, precipitation chance. ' +
          'Use to adjust activity suggestions (indoor vs outdoor) and timing.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date to get forecast for (YYYY-MM-DD)',
            },
            city: {
              type: 'string',
              description: 'City name (Oakland, Berkeley, Walnut Creek, Lafayette, Orinda, SF)',
            },
            coordinates: {
              type: 'object',
              description: 'Optional coordinates (if not using city)',
              properties: {
                latitude: {
                  type: 'number',
                  description: 'Latitude (36-39 for Oakland area)',
                },
                longitude: {
                  type: 'number',
                  description: 'Longitude (-123 to -121 for Oakland area)',
                },
              },
            },
          },
          required: ['date', 'city'],
        },
      },
      {
        name: 'calculate_drive_time',
        description:
          'Calculate drive time between locations. ' +
          'Supports: home->activity (database), city->city (estimates), activity->activity (estimates). ' +
          'Returns drive_time_minutes and source (database/estimated/fallback).',
        inputSchema: {
          type: 'object',
          properties: {
            from_location: {
              type: 'string',
              description: 'Starting location: "home", activity UUID, or city name',
            },
            to_location: {
              type: 'string',
              description: 'Destination: activity UUID or city name',
            },
          },
          required: ['from_location', 'to_location'],
        },
      },
      {
        name: 'suggest_timing',
        description:
          'Suggest optimal start/end times for an activity. ' +
          'Combines weather, drive time, and activity details. ' +
          'Returns suggested_start, suggested_end, reasoning, weather, drive_time.',
        inputSchema: {
          type: 'object',
          properties: {
            activity_id: {
              type: 'string',
              description: 'UUID of the activity',
            },
            date: {
              type: 'string',
              description: 'Date of the activity (YYYY-MM-DD)',
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
      case 'check_calendar_conflicts':
        result = await checkCalendarConflicts(args as any as CheckCalendarConflictsArgs);
        break;

      case 'get_weather_forecast':
        result = await getWeatherForecast(args as any as GetWeatherForecastArgs);
        break;

      case 'calculate_drive_time':
        result = await calculateDriveTime(args as any as CalculateDriveTimeArgs);
        break;

      case 'suggest_timing':
        result = await suggestTiming(args as any as SuggestTimingArgs);
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
  console.error('Schedule Sync MCP server running on stdio');
}

// Start server and handle errors
main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
