#!/usr/bin/env node

/**
 * End-to-end test for Orchestrator MCP Server
 * 
 * Tests all three tools:
 * - plan_weekend
 * - get_day_plan
 * - answer_question
 */

import { planWeekend, getDayPlan, answerQuestion } from './dist/exports.js';

console.log('========================================');
console.log('Orchestrator MCP Server - E2E Test');
console.log('========================================\n');

// Test 1: plan_weekend
console.log('TEST 1: plan_weekend');
console.log('--------------------');
try {
  const result = await planWeekend({
    date: '2025-10-18',
    num_suggestions: 3
  });
  
  const data = JSON.parse(result);
  console.log('✅ plan_weekend succeeded');
  console.log(`Generated ${data.suggestions?.length || 0} suggestions`);
  
  if (data.suggestions && data.suggestions.length > 0) {
    console.log('\nSample suggestion:');
    console.log(data.suggestions[0].summary);
    console.log('\nFull first suggestion:');
    console.log(JSON.stringify(data.suggestions[0], null, 2));
  }
} catch (error) {
  console.log('❌ plan_weekend failed:', error.message);
}

console.log('\n========================================\n');

// Test 2: answer_question
console.log('TEST 2: answer_question');
console.log('------------------------');
try {
  const questions = [
    'What is the weather tomorrow?',
    'Find me mexican restaurants',
    'Show me indoor activities'
  ];
  
  for (const question of questions) {
    console.log(`\nQuestion: "${question}"`);
    const result = await answerQuestion({ question });
    const data = JSON.parse(result);
    console.log(`✅ Answered via ${data.source} (confidence: ${data.confidence})`);
  }
} catch (error) {
  console.log('❌ answer_question failed:', error.message);
}

console.log('\n========================================\n');

// Test 3: get_day_plan (using activity from plan_weekend)
console.log('TEST 3: get_day_plan');
console.log('--------------------');
try {
  // First get a plan to extract an activity_id
  const planResult = await planWeekend({
    date: '2025-10-18',
    num_suggestions: 1
  });
  
  const planData = JSON.parse(planResult);
  
  if (planData.suggestions && planData.suggestions.length > 0) {
    const activityId = planData.suggestions[0].activity.id;
    console.log(`Testing with activity: ${planData.suggestions[0].activity.name}`);
    
    const dayPlanResult = await getDayPlan({
      activity_id: activityId,
      date: '2025-10-18',
      include_alternatives: true
    });
    
    const dayPlanData = JSON.parse(dayPlanResult);
    console.log('✅ get_day_plan succeeded');
    console.log('\nTimeline:');
    dayPlanData.total_timeline.forEach(entry => {
      console.log(`  ${entry.time} - ${entry.activity} (${entry.duration_minutes} min)`);
    });
    
    if (dayPlanData.restaurant) {
      console.log(`\nRestaurant: ${dayPlanData.restaurant.details.name}`);
    }
    
    if (dayPlanData.alternatives && dayPlanData.alternatives.length > 0) {
      console.log(`\nAlternatives: ${dayPlanData.alternatives.length} options`);
    }
  }
} catch (error) {
  console.log('❌ get_day_plan failed:', error.message);
}

console.log('\n========================================');
console.log('All tests complete!');
console.log('========================================\n');
