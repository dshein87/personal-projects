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

// TODO: Import subagent tools when ready
// import { ActivityPlannerTools } from '../activity-planner/src/tools.js';
// import { MusicScoutTools } from '../music-scout/src/tools.js';
// import { FoodFinderTools } from '../food-finder/src/tools.js';
// import { ScheduleSyncTools } from '../schedule-sync/src/tools.js';

/**
 * Tool: plan_weekend
 *
 * Main entry point for weekend planning.
 * Coordinates all subagents to generate 3 comprehensive suggestions.
 */
async function planWeekend(args: {
  date: string;
  preferences?: Record<string, any>;
}): Promise<string> {
  // TODO: Implement weekend planning logic

  // 1. Call Schedule Sync to check calendar conflicts and weather
  //    const schedule = await ScheduleSyncTools.checkCalendar(args.date);
  //    const weather = await ScheduleSyncTools.getWeather(args.date);

  // 2. Call Activity Planner to get activity suggestions
  //    const activities = await ActivityPlannerTools.suggestActivities({
  //      date: args.date,
  //      weather: weather,
  //      preferences: args.preferences
  //    });

  // 3. For each activity, call Food Finder to match restaurants
  //    const withRestaurants = await Promise.all(
  //      activities.map(async (activity) => {
  //        const restaurants = await FoodFinderTools.matchRestaurant(activity.id);
  //        return { ...activity, restaurants };
  //      })
  //    );

  // 4. Call Schedule Sync to optimize timing and routes
  //    const optimized = await ScheduleSyncTools.optimizeRoute(withRestaurants);

  // 5. Format and return 3 complete day plans

  return JSON.stringify({
    status: 'TODO',
    message: 'Orchestrator plan_weekend not yet implemented',
    suggestions: []
  }, null, 2);
}

/**
 * Tool: get_day_plan
 *
 * Get detailed plan for a specific day with selected activities.
 */
async function getDayPlan(args: {
  date: string;
  activity_ids: string[];
}): Promise<string> {
  // TODO: Implement day plan logic

  // 1. Fetch full activity details from Supabase
  // 2. Call Food Finder to suggest restaurants near activities
  // 3. Call Schedule Sync to create optimized timeline with drive times
  // 4. Format comprehensive day plan with:
  //    - Activity details
  //    - Restaurant options
  //    - Timing and logistics
  //    - What to bring
  //    - Weather considerations

  return JSON.stringify({
    status: 'TODO',
    message: 'Orchestrator get_day_plan not yet implemented'
  }, null, 2);
}

/**
 * Tool: answer_question
 *
 * Handle follow-up questions about suggestions.
 */
async function answerQuestion(args: {
  question: string;
  context?: Record<string, any>;
}): Promise<string> {
  // TODO: Implement question answering logic

  // Use context from previous suggestions to answer questions like:
  // - "Tell me more about option 1"
  // - "What restaurants are near Tilden Park?"
  // - "What should we bring to Adventure Playground?"
  // - "Is there parking at the zoo?"

  return JSON.stringify({
    status: 'TODO',
    message: 'Orchestrator answer_question not yet implemented'
  }, null, 2);
}

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'plan_weekend',
        description: 'Generate 3 comprehensive weekend activity suggestions with restaurants and logistics',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date for the weekend (YYYY-MM-DD format)',
            },
            preferences: {
              type: 'object',
              description: 'Optional preferences for filtering (weather, activity types, etc.)',
            },
          },
          required: ['date'],
        },
      },
      {
        name: 'get_day_plan',
        description: 'Get detailed plan for a specific day with selected activities',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date for the plan (YYYY-MM-DD)',
            },
            activity_ids: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of activity UUIDs to include in the plan',
            },
          },
          required: ['date', 'activity_ids'],
        },
      },
      {
        name: 'answer_question',
        description: 'Answer follow-up questions about suggestions or activities',
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
