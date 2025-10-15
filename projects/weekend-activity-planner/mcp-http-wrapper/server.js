import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import MCP server tools
import { planWeekend, getDayPlan, answerQuestion } from '../mcp-servers/orchestrator/dist/exports.js';
import { queryActivities, suggestActivityChain, getActivityDetails, checkOpeningHours } from '../mcp-servers/activity-planner/dist/exports.js';
import { findRestaurants, getRestaurantDetails, checkDietarySafety, matchRestaurantToActivity } from '../mcp-servers/food-finder/dist/exports.js';
import { checkCalendarConflicts, getWeatherForecast, calculateDriveTime, suggestTiming } from '../mcp-servers/schedule-sync/dist/exports.js';

const app = express();
const PORT = process.env.MCP_HTTP_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /orchestrator/plan_weekend',
      'POST /orchestrator/get_day_plan',
      'POST /orchestrator/answer_question',
      'POST /activity-planner/query_activities',
      'POST /activity-planner/suggest_activity_chain',
      'POST /activity-planner/get_activity_details',
      'POST /activity-planner/check_opening_hours',
      'POST /food-finder/find_restaurants',
      'POST /food-finder/get_restaurant_details',
      'POST /food-finder/check_dietary_safety',
      'POST /food-finder/match_restaurant_to_activity',
      'POST /schedule-sync/check_calendar_conflicts',
      'POST /schedule-sync/get_weather_forecast',
      'POST /schedule-sync/calculate_drive_time',
      'POST /schedule-sync/suggest_timing'
    ]
  });
});

// Error handling wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    console.error('Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  });
};

// ===== ORCHESTRATOR ENDPOINTS =====

app.post('/orchestrator/plan_weekend', asyncHandler(async (req, res) => {
  const result = await planWeekend(req.body);
  res.json(JSON.parse(result));
}));

app.post('/orchestrator/get_day_plan', asyncHandler(async (req, res) => {
  const result = await getDayPlan(req.body);
  res.json(JSON.parse(result));
}));

app.post('/orchestrator/answer_question', asyncHandler(async (req, res) => {
  const result = await answerQuestion(req.body);
  res.json({ answer: result });
}));

// ===== ACTIVITY PLANNER ENDPOINTS =====

app.post('/activity-planner/query_activities', asyncHandler(async (req, res) => {
  const result = await queryActivities(req.body);
  res.json(JSON.parse(result));
}));

app.post('/activity-planner/suggest_activity_chain', asyncHandler(async (req, res) => {
  const result = await suggestActivityChain(req.body);
  res.json(JSON.parse(result));
}));

app.post('/activity-planner/get_activity_details', asyncHandler(async (req, res) => {
  const result = await getActivityDetails(req.body);
  res.json(JSON.parse(result));
}));

app.post('/activity-planner/check_opening_hours', asyncHandler(async (req, res) => {
  const result = await checkOpeningHours(req.body);
  res.json({ status: result });
}));

// ===== FOOD FINDER ENDPOINTS =====

app.post('/food-finder/find_restaurants', asyncHandler(async (req, res) => {
  const result = await findRestaurants(req.body);
  res.json(JSON.parse(result));
}));

app.post('/food-finder/get_restaurant_details', asyncHandler(async (req, res) => {
  const result = await getRestaurantDetails(req.body);
  res.json(JSON.parse(result));
}));

app.post('/food-finder/check_dietary_safety', asyncHandler(async (req, res) => {
  const result = await checkDietarySafety(req.body);
  res.json(JSON.parse(result));
}));

app.post('/food-finder/match_restaurant_to_activity', asyncHandler(async (req, res) => {
  const result = await matchRestaurantToActivity(req.body);
  res.json(JSON.parse(result));
}));

// ===== SCHEDULE SYNC ENDPOINTS =====

app.post('/schedule-sync/check_calendar_conflicts', asyncHandler(async (req, res) => {
  const result = await checkCalendarConflicts(req.body);
  res.json({ conflicts: result });
}));

app.post('/schedule-sync/get_weather_forecast', asyncHandler(async (req, res) => {
  const result = await getWeatherForecast(req.body);
  res.json(JSON.parse(result));
}));

app.post('/schedule-sync/calculate_drive_time', asyncHandler(async (req, res) => {
  const result = await calculateDriveTime(req.body);
  res.json({ drive_time_minutes: result });
}));

app.post('/schedule-sync/suggest_timing', asyncHandler(async (req, res) => {
  const result = await suggestTiming(req.body);
  res.json(JSON.parse(result));
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Endpoint ${req.method} ${req.path} does not exist`,
    hint: 'Visit GET /health to see available endpoints'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  MCP HTTP Wrapper Server                                   ║
╠════════════════════════════════════════════════════════════╣
║  Status: ✅ Running                                        ║
║  Port: ${PORT}                                             ║
║  Health: http://localhost:${PORT}/health                   ║
║                                                            ║
║  Environment:                                              ║
║    - Supabase: ${process.env.SUPABASE_URL ? '✅ Connected' : '❌ Missing'}             ║
║    - Anthropic: ${process.env.ANTHROPIC_API_KEY ? '✅ Configured' : '❌ Missing'}          ║
║                                                            ║
║  Available Servers:                                        ║
║    - Orchestrator (3 tools)                                ║
║    - Activity Planner (4 tools)                            ║
║    - Food Finder (4 tools)                                 ║
║    - Schedule Sync (4 tools)                               ║
║                                                            ║
║  Total: 15 HTTP endpoints ready for n8n                    ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
