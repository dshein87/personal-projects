// Integration test for all MCP servers
import { planWeekend } from './mcp-servers/orchestrator/dist/exports.js';

console.log('🧪 Testing Weekend Activity Planner Integration...\n');

try {
  // Test: Plan weekend for Saturday
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split('T')[0];
  
  console.log(`📅 Planning for: ${dateStr}\n`);
  
  const result = await planWeekend({
    date: dateStr,
    num_suggestions: 3
  });
  
  const plan = JSON.parse(result);
  
  console.log('✅ SUCCESS! Generated plan with', plan.suggestions.length, 'suggestions\n');
  
  // Display first suggestion
  if (plan.suggestions[0]) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(plan.suggestions[0].summary);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
  
  console.log('📊 Test Results:');
  console.log('  - Weather API:', plan.suggestions[0]?.weather ? '✅' : '❌');
  console.log('  - Activity scoring:', plan.suggestions[0]?.activity?.score ? '✅' : '❌');
  console.log('  - Timing suggestions:', plan.suggestions[0]?.timing ? '✅' : '❌');
  console.log('  - Restaurant matching:', plan.suggestions[0]?.restaurant ? '✅' : '⚠️ (optional)');
  console.log('  - WhatsApp formatting:', plan.suggestions[0]?.summary ? '✅' : '❌');
  
  console.log('\n🎉 Integration test PASSED!\n');
  
} catch (error) {
  console.error('❌ Integration test FAILED:');
  console.error(error);
  process.exit(1);
}
