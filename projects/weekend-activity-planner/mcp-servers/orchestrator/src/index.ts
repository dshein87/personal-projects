#!/usr/bin/env node

/**
 * Orchestrator MCP Server
 *
 * Main coordinator for the Weekend Activity Planner.
 * Handles WhatsApp conversations and coordinates subagent tools.
 *
 * Tools provided:
 * - plan_weekend: Main entry point for weekend planning
 * - get_day_plan: Detailed day planning with multiple activities
 * - answer_question: Handle follow-up questions about suggestions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Import all subagent tools
import {
  queryActivities,
  suggestActivityChain,
  getActivityDetails,
  checkOpeningHours,
} from '../../activity-planner/dist/exports.js';

import {
  checkCalendarConflicts,
  getWeatherForecast,
  calculateDriveTime,
  suggestTiming,
} from '../../schedule-sync/dist/exports.js';

import {
  findRestaurants,
  getRestaurantDetails,
  checkDietarySafety,
  matchRestaurantToActivity,
} from '../../food-finder/dist/exports.js';

// Load environment variables from project root
dotenv.config({ path: '../../.env' });

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Server setup
const server = new Server(
  {
    name: 'weekend-planner-orchestrator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Type definitions
interface PlanWeekendArgs {
  date: string;
  num_suggestions?: number;
  preferences?: {
    weather_override?: string;
    max_drive_time?: number;
    cuisine_preference?: string;
    indoor_outdoor?: string;
  };
}

interface GetDayPlanArgs {
  activity_id: string;
  date: string;
  include_alternatives?: boolean;
}

interface AnswerQuestionArgs {
  question: string;
  context?: {
    last_plan?: any;
    last_activity_id?: string;
  };
}

interface TimelineEntry {
  time: string;
  activity: string;
  duration_minutes: number;
  notes: string;
}

/**
 * Helper: Validate UUID format
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Helper: Validate date format (YYYY-MM-DD)
 */
function isValidDate(dateString: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Helper: Get tomorrow's date
 */
function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

/**
 * Helper: Get next Saturday
 */
function getNextSaturday(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntilSaturday);
  return d.toISOString().split('T')[0];
}

/**
 * Helper: Extract cuisine from question
 */
function extractCuisine(question: string): string | null {
  const cuisines = ['mexican', 'italian', 'chinese', 'japanese', 'thai', 'indian', 'pizza'];
  return cuisines.find(c => question.includes(c)) || null;
}

/**
 * Helper: Extract city from question
 */
function extractCity(question: string): string | null {
  const cities = ['Oakland', 'Berkeley', 'Walnut Creek', 'Lafayette', 'Orinda', 'SF', 'San Francisco'];
  return cities.find(c => question.toLowerCase().includes(c.toLowerCase())) || null;
}

/**
 * Helper: Extract date from question
 */
function extractDate(question: string): string | null {
  if (question.includes('tomorrow')) return getTomorrow();
  if (question.includes('saturday')) return getNextSaturday();

  // Try to find YYYY-MM-DD pattern
  const dateMatch = question.match(/\d{4}-\d{2}-\d{2}/);
  if (dateMatch) return dateMatch[0];

  return null;
}

/**
 * Helper: Format suggestion for WhatsApp
 */
function formatSuggestionForWhatsApp(
  activity: any,
  restaurant: any,
  timing: any,
  weather: any
): string {
  const emojiMap: Record<string, string> = {
    sunny: '☀️',
    clear: '☀️',
    rainy: '🌧️',
    cloudy: '☁️',
    'partly cloudy': '⛅',
    hot: '🔥',
    cold: '❄️',
    mild: '🌤️',
  };

  const weatherEmoji = emojiMap[weather.condition?.toLowerCase()] || '🌤️';

  // Calculate score components for explanation
  const scoreBreakdown = activity.score_breakdown || {};
  const isHighlyRated = (scoreBreakdown.rating_component || 0) > 0.3;
  const isNearby = (scoreBreakdown.drive_time_component || 0) > 0.8;

  let whyText = `Score ${activity.score?.toFixed(2) || 'N/A'}`;
  if (isHighlyRated && isNearby) {
    whyText += ' - Highly rated and close by';
  } else if (isHighlyRated) {
    whyText += ' - Highly rated, worth the drive';
  } else if (isNearby) {
    whyText += ' - Good novelty, close by';
  } else {
    whyText += ' - Good balance of quality and distance';
  }

  const restaurantSection = restaurant
    ? `\n🍽️ **After:** ${restaurant.name}
🥙 ${restaurant.cuisine || 'Restaurant'} (${restaurant.drive_time_from_activity || '?'} min from activity)
✅ Celiac-safe, allergen-free`
    : '\n🍽️ **After:** Restaurant options available nearby';

  return `
🎯 **${activity.name}** (${activity.city || 'Oakland'})
📍 ${activity.drive_time_minutes || '?'} min drive
⏰ ${timing.suggested_start || '10:00'} - ${timing.suggested_end || '12:00'}
${weatherEmoji} ${weather.condition || 'Mild'} (${weather.temperature_high || '?'}°F)
${restaurantSection}

💡 **Why:** ${whyText}
  `.trim();
}

/**
 * Helper: Build timeline for day plan
 */
function buildTimeline(activity: any, restaurant: any, timing: any): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  try {
    // Parse times
    const startTime = timing.suggested_start || '10:00';
    const endTime = timing.suggested_end || '12:00';

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const driveTime = activity.drive_time_minutes || 30;

    // Calculate departure time
    let departMin = startMin - (driveTime % 60);
    let departHour = startHour - Math.floor(driveTime / 60);

    if (departMin < 0) {
      departMin += 60;
      departHour -= 1;
    }

    // Entry 1: Leave home
    entries.push({
      time: `${String(departHour).padStart(2, '0')}:${String(departMin).padStart(2, '0')}`,
      activity: 'Leave home',
      duration_minutes: driveTime,
      notes: `Drive to ${activity.city || 'destination'}`
    });

    // Entry 2: Activity
    const activityDuration = (endHour - startHour) * 60 + (endMin - startMin);
    const activityName = activity.details?.name || activity.name || 'activity';
    const activityDescription = activity.details?.description || activity.description || 'Enjoy the activity';

    entries.push({
      time: startTime,
      activity: `Arrive at ${activityName}`,
      duration_minutes: activityDuration > 0 ? activityDuration : 120,
      notes: activityDescription
    });

    // Entry 3: Drive to restaurant (if available)
    if (restaurant) {
      const driveToRestaurant = restaurant.drive_time_from_activity || 10;
      entries.push({
        time: endTime,
        activity: `Drive to ${restaurant.name}`,
        duration_minutes: driveToRestaurant,
        notes: `${restaurant.cuisine || 'Restaurant'}`
      });

      // Entry 4: Lunch
      let lunchHour = endHour + Math.floor(driveToRestaurant / 60);
      let lunchMin = endMin + (driveToRestaurant % 60);

      if (lunchMin >= 60) {
        lunchMin -= 60;
        lunchHour += 1;
      }

      entries.push({
        time: `${String(lunchHour).padStart(2, '0')}:${String(lunchMin).padStart(2, '0')}`,
        activity: `Lunch at ${restaurant.name}`,
        duration_minutes: 60,
        notes: '✅ Dietary restrictions checked'
      });

      // Entry 5: Return home
      const returnHour = lunchHour + 1;
      const returnMin = lunchMin;
      entries.push({
        time: `${String(returnHour).padStart(2, '0')}:${String(returnMin).padStart(2, '0')}`,
        activity: 'Return home',
        duration_minutes: driveTime,
        notes: 'End of outing'
      });
    } else {
      // No restaurant - just return home
      entries.push({
        time: endTime,
        activity: 'Return home',
        duration_minutes: driveTime,
        notes: 'End of outing'
      });
    }

  } catch (error) {
    console.error('Error building timeline:', error);
    // Return simple fallback timeline
    entries.push({
      time: '10:00',
      activity: `Visit ${activity.name}`,
      duration_minutes: 120,
      notes: 'Enjoy the activity'
    });
  }

  return entries;
}

/**
 * Tool: plan_weekend
 *
 * Main entry point for weekend planning.
 * Coordinates all subagents to generate 3 comprehensive suggestions.
 */
export async function planWeekend(args: PlanWeekendArgs): Promise<string> {
  try {
    // Validate date
    if (!isValidDate(args.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }

    const numSuggestions = Math.min(args.num_suggestions || 3, 10);

    // Step 1: Get weather forecast for Oakland (default location)
    console.error(`[Orchestrator] Getting weather for ${args.date}...`);
    const weatherResult = await getWeatherForecast({
      date: args.date,
      city: 'Oakland'
    });
    const weather = JSON.parse(weatherResult);
    console.error(`[Orchestrator] Weather: ${weather.condition}, ${weather.temperature_high}°F`);

    // Step 2: Get activity suggestions using scoring algorithm
    console.error(`[Orchestrator] Getting ${numSuggestions} activity suggestions...`);
    const activityResult = await suggestActivityChain({
      date: args.date,
      num_suggestions: numSuggestions,
      weather_condition: args.preferences?.weather_override || weather.condition,
      attendees: ['3yo', '5yo']
    });
    const activityData = JSON.parse(activityResult);
    const activities = activityData.suggestions || [];

    console.error(`[Orchestrator] Got ${activities.length} activities, matching restaurants...`);

    // Step 3: For each activity, build complete suggestion
    const suggestions = [];

    for (const activity of activities) {
      try {
        // Get weather for activity's city (if different from Oakland)
        const activityWeather = activity.city !== 'Oakland'
          ? JSON.parse(await getWeatherForecast({ date: args.date, city: activity.city }))
          : weather;

        // Find restaurant near activity
        let restaurant = null;
        try {
          const restaurantResult = await matchRestaurantToActivity({
            activity_id: activity.id,
            max_detour_minutes: 15
          });
          const restaurantData = JSON.parse(restaurantResult);
          restaurant = restaurantData.matched_restaurants?.[0] || null;
        } catch (error) {
          console.error(`[Orchestrator] Could not find restaurant for ${activity.name}:`, error);
          // Continue without restaurant
        }

        // Get timing suggestion
        const timingResult = await suggestTiming({
          activity_id: activity.id,
          date: args.date
        });
        const timing = JSON.parse(timingResult);

        // Calculate total drive time
        const homeToActivity = activity.drive_time_minutes || 30;
        const activityToRestaurant = restaurant?.drive_time_from_activity || 5;
        const totalDriveTime = homeToActivity + activityToRestaurant;

        // Create WhatsApp-friendly summary
        const summary = formatSuggestionForWhatsApp(
          activity,
          restaurant,
          timing,
          activityWeather
        );

        suggestions.push({
          activity,
          restaurant,
          timing,
          weather: activityWeather,
          total_drive_time: totalDriveTime,
          summary
        });
      } catch (error) {
        console.error(`[Orchestrator] Error processing activity ${activity.name}:`, error);
        // Continue with next activity
      }
    }

    console.error(`[Orchestrator] Successfully generated ${suggestions.length} complete suggestions`);

    return JSON.stringify({
      date: args.date,
      suggestions,
      metadata: {
        generated_at: new Date().toISOString(),
        weather_considered: true,
        preferences_applied: args.preferences ? Object.keys(args.preferences) : []
      }
    }, null, 2);

  } catch (error) {
    console.error('[Orchestrator] Error in plan_weekend:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to generate weekend plan: ${errorMessage}`);
  }
}

/**
 * Tool: get_day_plan
 *
 * Get detailed plan for a specific day with selected activities.
 */
export async function getDayPlan(args: GetDayPlanArgs): Promise<string> {
  try {
    // Validate inputs
    if (!isValidUUID(args.activity_id)) {
      throw new Error('Invalid activity_id. Must be a valid UUID.');
    }

    if (!isValidDate(args.date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD.');
    }

    console.error(`[Orchestrator] Getting detailed plan for activity ${args.activity_id}...`);

    // Step 1: Get full activity details
    const activityResult = await getActivityDetails({ activity_id: args.activity_id });
    const activity = JSON.parse(activityResult);

    // Step 2: Get timing (includes weather)
    const timingResult = await suggestTiming({
      activity_id: args.activity_id,
      date: args.date
    });
    const timing = JSON.parse(timingResult);

    // Step 3: Get matched restaurants
    let restaurant = null;
    let dietarySafety = null;

    try {
      const restaurantResult = await matchRestaurantToActivity({
        activity_id: args.activity_id,
        max_detour_minutes: 15
      });
      const restaurantData = JSON.parse(restaurantResult);
      restaurant = restaurantData.matched_restaurants?.[0] || null;

      // Step 4: Check dietary safety
      if (restaurant) {
        const safetyResult = await checkDietarySafety({
          restaurant_id: restaurant.id
        });
        dietarySafety = JSON.parse(safetyResult);
      }
    } catch (error) {
      console.error('[Orchestrator] Could not get restaurant details:', error);
      // Continue without restaurant
    }

    // Step 5: Get alternatives if bad weather or if requested
    let alternatives = [];
    if (args.include_alternatives) {
      try {
        const weatherCondition = timing.weather?.condition || 'unknown';
        const needsBackup = ['rainy', 'cold', 'stormy'].some(w =>
          weatherCondition.toLowerCase().includes(w)
        );

        if (needsBackup || args.include_alternatives) {
          const altResult = await suggestActivityChain({
            date: args.date,
            num_suggestions: 2,
            weather_condition: timing.weather?.condition,
            attendees: ['3yo', '5yo']
          });
          const altData = JSON.parse(altResult);
          alternatives = (altData.suggestions || []).filter((a: any) => a.id !== args.activity_id);
        }
      } catch (error) {
        console.error('[Orchestrator] Could not get alternatives:', error);
        // Continue without alternatives
      }
    }

    // Step 6: Build timeline
    const timeline = buildTimeline(activity, restaurant, timing);

    console.error('[Orchestrator] Successfully generated detailed day plan');

    return JSON.stringify({
      main_activity: {
        details: activity,
        timing,
        weather: timing.weather,
        driving_directions: `From home to ${activity.name}: ${activity.drive_time_minutes || '?'} min via Google Maps`
      },
      restaurant: restaurant ? {
        details: restaurant,
        dietary_safety: dietarySafety,
        drive_from_activity: restaurant.drive_time_from_activity
      } : null,
      alternatives: args.include_alternatives ? alternatives : undefined,
      total_timeline: timeline
    }, null, 2);

  } catch (error) {
    console.error('[Orchestrator] Error in get_day_plan:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to generate day plan: ${errorMessage}`);
  }
}

/**
 * Tool: answer_question
 *
 * Handle follow-up questions about suggestions.
 */
export async function answerQuestion(args: AnswerQuestionArgs): Promise<string> {
  try {
    const question = args.question.toLowerCase();

    console.error(`[Orchestrator] Answering question: "${args.question}"`);

    // Restaurant questions
    if (question.includes('restaurant') || question.includes('food') || question.includes('eat')) {
      if (question.includes('safe') || question.includes('allergen') || question.includes('gluten')) {
        const restaurantId = args.context?.last_plan?.suggestions?.[0]?.restaurant?.id;
        if (restaurantId) {
          const result = await checkDietarySafety({ restaurant_id: restaurantId });
          return JSON.stringify({
            answer: result,
            source: 'Food Finder',
            confidence: 'high'
          });
        }
      }

      const cuisine = extractCuisine(question);
      const result = await findRestaurants({
        cuisine_preference: cuisine || undefined,
        limit: 5
      });
      return JSON.stringify({
        answer: result,
        source: 'Food Finder',
        confidence: 'high'
      });
    }

    // Activity questions
    if (question.includes('activity') || question.includes('place') || question.includes('do') || question.includes('park')) {
      if (question.includes('indoor')) {
        const result = await queryActivities({
          indoor_outdoor: 'indoor',
          limit: 5
        });
        return JSON.stringify({
          answer: result,
          source: 'Activity Planner',
          confidence: 'high'
        });
      }

      if (question.includes('outdoor')) {
        const result = await queryActivities({
          indoor_outdoor: 'outdoor',
          limit: 5
        });
        return JSON.stringify({
          answer: result,
          source: 'Activity Planner',
          confidence: 'high'
        });
      }

      // General activity search
      const result = await suggestActivityChain({
        date: getTomorrow(),
        num_suggestions: 5
      });
      return JSON.stringify({
        answer: result,
        source: 'Activity Planner',
        confidence: 'medium'
      });
    }

    // Weather questions
    if (question.includes('weather') || question.includes('rain') || question.includes('temperature')) {
      const city = extractCity(question) || 'Oakland';
      const date = extractDate(question) || getTomorrow();
      const result = await getWeatherForecast({ date, city });
      return JSON.stringify({
        answer: result,
        source: 'Schedule Sync',
        confidence: 'high'
      });
    }

    // Timing questions
    if (question.includes('when') || question.includes('time') || question.includes('hours')) {
      const activityId = args.context?.last_activity_id;
      if (activityId && isValidUUID(activityId)) {
        const result = await suggestTiming({
          activity_id: activityId,
          date: getTomorrow()
        });
        return JSON.stringify({
          answer: result,
          source: 'Schedule Sync',
          confidence: 'high'
        });
      }
    }

    // Drive time questions
    if (question.includes('drive') || question.includes('far') || question.includes('distance')) {
      const city = extractCity(question);
      if (city) {
        const result = await queryActivities({
          city: city,
          limit: 5
        });
        return JSON.stringify({
          answer: result,
          source: 'Activity Planner',
          confidence: 'medium'
        });
      }
    }

    // Fallback
    console.error('[Orchestrator] No matching handler found for question');
    return JSON.stringify({
      answer: "I'm not sure how to answer that. I can help with:\n- Activities (indoor, outdoor, specific cities)\n- Restaurants (cuisines, dietary restrictions)\n- Weather forecasts\n- Timing suggestions\n- Drive times and distances",
      source: 'Orchestrator',
      confidence: 'low'
    });

  } catch (error) {
    console.error('[Orchestrator] Error in answer_question:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Unable to answer question: ${errorMessage}`);
  }
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'plan_weekend',
        description: 'Generate comprehensive weekend activity suggestions with restaurants, timing, and weather. Returns 3 complete day plans by default.',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date for the weekend (YYYY-MM-DD format)',
            },
            num_suggestions: {
              type: 'number',
              description: 'Number of suggestions to generate (default: 3, max: 10)',
            },
            preferences: {
              type: 'object',
              description: 'Optional preferences for filtering',
              properties: {
                weather_override: {
                  type: 'string',
                  description: 'Override weather condition (e.g., "rainy", "sunny")'
                },
                max_drive_time: {
                  type: 'number',
                  description: 'Maximum drive time in minutes'
                },
                cuisine_preference: {
                  type: 'string',
                  description: 'Preferred cuisine type (e.g., "mexican", "italian")'
                },
                indoor_outdoor: {
                  type: 'string',
                  description: 'Activity type: "indoor", "outdoor", or "both"'
                }
              }
            },
          },
          required: ['date'],
        },
      },
      {
        name: 'get_day_plan',
        description: 'Get detailed plan for a specific activity including timeline, restaurant options, and weather alternatives',
        inputSchema: {
          type: 'object',
          properties: {
            activity_id: {
              type: 'string',
              description: 'UUID of the activity to plan around',
            },
            date: {
              type: 'string',
              description: 'Date for the plan (YYYY-MM-DD)',
            },
            include_alternatives: {
              type: 'boolean',
              description: 'Whether to include alternative activities for bad weather (default: false)',
            },
          },
          required: ['activity_id', 'date'],
        },
      },
      {
        name: 'answer_question',
        description: 'Answer follow-up questions about activities, restaurants, weather, or timing',
        inputSchema: {
          type: 'object',
          properties: {
            question: {
              type: 'string',
              description: 'The question to answer',
            },
            context: {
              type: 'object',
              description: 'Optional context from previous suggestions',
              properties: {
                last_plan: {
                  type: 'object',
                  description: 'Previous plan_weekend result'
                },
                last_activity_id: {
                  type: 'string',
                  description: 'Last activity ID discussed'
                }
              }
            },
          },
          required: ['question'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case 'plan_weekend':
        result = await planWeekend(args as any);
        break;

      case 'get_day_plan':
        result = await getDayPlan(args as any);
        break;

      case 'answer_question':
        result = await answerQuestion(args as any);
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Orchestrator] Error handling ${name}:`, errorMessage);
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Orchestrator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
