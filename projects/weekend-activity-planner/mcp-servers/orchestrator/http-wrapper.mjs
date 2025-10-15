#!/usr/bin/env node

/**
 * HTTP Wrapper for Orchestrator MCP Server
 *
 * Exposes orchestrator tools as REST API endpoints for n8n to call.
 *
 * Endpoints:
 * - POST /api/plan-weekend
 * - POST /api/get-day-plan
 * - POST /api/answer-question
 * - GET /api/health
 */

import express from 'express';
import { planWeekend, getDayPlan, answerQuestion } from './dist/exports.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// CORS (allow n8n Cloud to call this)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'orchestrator-mcp-wrapper',
    timestamp: new Date().toISOString()
  });
});

// Plan weekend endpoint
app.post('/api/plan-weekend', async (req, res) => {
  try {
    const { date, num_suggestions } = req.body;

    if (!date) {
      return res.status(400).json({ error: 'date is required' });
    }

    console.log(`[${new Date().toISOString()}] plan_weekend request: date=${date}, num=${num_suggestions || 3}`);

    const result = await planWeekend({
      date,
      num_suggestions: num_suggestions || 3
    });

    const data = JSON.parse(result);
    res.json(data);
  } catch (error) {
    console.error('plan_weekend error:', error);
    res.status(500).json({
      error: 'Failed to plan weekend',
      message: error.message
    });
  }
});

// Get day plan endpoint
app.post('/api/get-day-plan', async (req, res) => {
  try {
    const { activity_id, date, include_alternatives } = req.body;

    if (!activity_id || !date) {
      return res.status(400).json({ error: 'activity_id and date are required' });
    }

    console.log(`[${new Date().toISOString()}] get_day_plan request: activity=${activity_id}, date=${date}`);

    const result = await getDayPlan({
      activity_id,
      date,
      include_alternatives: include_alternatives !== false
    });

    const data = JSON.parse(result);
    res.json(data);
  } catch (error) {
    console.error('get_day_plan error:', error);
    res.status(500).json({
      error: 'Failed to get day plan',
      message: error.message
    });
  }
});

// Answer question endpoint
app.post('/api/answer-question', async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'question is required' });
    }

    console.log(`[${new Date().toISOString()}] answer_question request: "${question}"`);

    const result = await answerQuestion({ question });
    const data = JSON.parse(result);
    res.json(data);
  } catch (error) {
    console.error('answer_question error:', error);
    res.status(500).json({
      error: 'Failed to answer question',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    available_endpoints: [
      'GET /api/health',
      'POST /api/plan-weekend',
      'POST /api/get-day-plan',
      'POST /api/answer-question'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log('========================================');
  console.log('Orchestrator MCP HTTP Wrapper');
  console.log('========================================');
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('\nAvailable endpoints:');
  console.log(`  GET  http://localhost:${PORT}/api/health`);
  console.log(`  POST http://localhost:${PORT}/api/plan-weekend`);
  console.log(`  POST http://localhost:${PORT}/api/get-day-plan`);
  console.log(`  POST http://localhost:${PORT}/api/answer-question`);
  console.log('========================================\n');
});
