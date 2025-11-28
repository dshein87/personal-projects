#!/usr/bin/env node

/**
 * Demo: WhatsApp-style output from Orchestrator
 * 
 * Shows what a user would see in WhatsApp when asking for weekend plans.
 */

import { planWeekend } from './dist/exports.js';

console.log('========================================');
console.log('📱 WhatsApp Weekend Planner Demo');
console.log('========================================\n');

console.log('User: "Plan something for Saturday"');
console.log('\nBot: "Let me find 3 great options for Saturday, October 18...\n"\n');

try {
  const result = await planWeekend({
    date: '2025-10-18',
    num_suggestions: 3
  });
  
  const data = JSON.parse(result);
  
  if (data.suggestions && data.suggestions.length > 0) {
    console.log('========================================');
    data.suggestions.forEach((suggestion, index) => {
      console.log(`\nOption ${index + 1}:\n`);
      console.log(suggestion.summary);
      console.log('\n----------------------------------------');
    });
    
    console.log('\nBot: "Which one sounds good? Or want me to find more options?"\n');
  } else {
    console.log('No suggestions generated');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}

console.log('========================================\n');
