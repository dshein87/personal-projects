# Testing Guide

**Purpose:** Document how to test each component of the system.

---

## Quick Test Checklist

Before deploying changes:

- [ ] MCP servers build successfully
- [ ] Database schema applies cleanly
- [ ] All API keys are set in `.env`
- [ ] Orchestrator can call all subagent tools
- [ ] n8n workflows execute without errors
- [ ] WhatsApp messages send/receive correctly

---

## Testing MCP Servers

### Test Orchestrator

```bash
# From project root
cd mcp-servers/orchestrator
npm install
npm run build

# Test via Claude Code
claude code
```

In Claude Code:
```
> Use orchestrator tool: plan_weekend("2025-10-12", {"weather": "sunny"})
```

**Expected result:** Returns 3 activity suggestions with full details

---

### Test Activity Planner

```bash
cd mcp-servers/activity-planner
npm install
npm run build
```

Test tool calls:
```
> query_activities({"weather": "sunny", "age_range": "3-5"})
> suggest_activity_chain("2025-10-12", 4, {"active": true})
> check_opening_hours(123, "2025-10-12")
```

**Expected results:**
- query_activities: Returns list of matching activities
- suggest_activity_chain: Returns 2-3 chained activities with timing
- check_opening_hours: Returns open/closed status

---

### Test Music Scout

```bash
cd mcp-servers/music-scout
npm install
npm run build
```

Test tool calls:
```
> sync_spotify_preferences("david")
> find_concerts(["Green Day", "Dashboard Confessional"], "Oakland", 6)
> get_concert_details(456)
```

**Expected results:**
- sync_spotify_preferences: Updates artist_preferences table
- find_concerts: Returns concerts within range
- get_concert_details: Returns full concert info with tickets

---

### Test Food Finder

```bash
cd mcp-servers/food-finder
npm install
npm run build
```

Test tool calls:
```
> find_restaurants("mexican", {"celiac": true}, "Oakland")
> match_restaurant_to_activity(123, "lunch")
> check_dietary_safety(789, ["celiac", "sesame"])
```

**Expected results:**
- find_restaurants: Returns safe restaurants
- match_restaurant_to_activity: Returns nearby restaurants
- check_dietary_safety: Returns safety assessment

---

### Test Schedule Sync

```bash
cd mcp-servers/schedule-sync
npm install
npm run build
```

Test tool calls:
```
> check_calendar_conflicts("2025-10-12", "2025-10-13")
> get_weather_forecast("2025-10-12", "Oakland")
> calculate_drive_time("Oakland, CA 94611", "Berkeley, CA")
> suggest_timing([activity1, activity2, activity3])
```

**Expected results:**
- check_calendar_conflicts: Returns list of conflicts
- get_weather_forecast: Returns forecast data
- calculate_drive_time: Returns minutes
- suggest_timing: Returns optimized schedule

---

## Testing Supabase Database

### Verify Schema

```bash
# Connect to Supabase and run:
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

**Expected tables:**
- activities
- restaurants
- visits
- events
- people
- preferences
- artist_preferences
- concerts
- venues

### Test Seed Data

```sql
-- Check activities loaded
SELECT COUNT(*) FROM activities;
-- Expected: ~75 rows

-- Check restaurants loaded
SELECT COUNT(*) FROM restaurants;
-- Expected: ~25 rows

-- Check dietary restrictions work
SELECT * FROM restaurants WHERE celiac_safe = true;
-- Expected: Multiple Mexican restaurants
```

### Test Queries

```sql
-- Find activities for 3-5 year olds
SELECT * FROM activities
WHERE age_min <= 3 AND age_max >= 5
LIMIT 10;

-- Find celiac-safe Mexican restaurants
SELECT * FROM restaurants
WHERE cuisine = 'mexican' AND celiac_safe = true;

-- Get visit history with ratings
SELECT a.name, v.rating_3yo, v.rating_5yo, v.notes
FROM visits v
JOIN activities a ON v.activity_id = a.id
ORDER BY v.visited_at DESC;
```

---

## Testing n8n Workflows

### Test Weekly Suggestions Workflow

1. Open n8n workflow editor
2. Click "Execute Workflow" manually (don't wait for cron)
3. Check execution log for errors
4. Verify WhatsApp message was sent
5. Check message content for 3 suggestions

**Expected output:**
- Workflow completes successfully
- WhatsApp message sent
- Message contains 3 activity suggestions
- Each suggestion has activities + restaurants + logistics

---

### Test Spotify Sync Workflow

1. Execute workflow manually
2. Check execution log
3. Query Supabase: `SELECT * FROM artist_preferences WHERE user_id = 'david' ORDER BY updated_at DESC LIMIT 10;`

**Expected output:**
- Top 50 artists in database
- Play count data populated
- Timestamp updated

---

### Test Concert Discovery Workflow

1. Execute workflow manually
2. Check for new concerts in Supabase
3. If new concerts found, verify WhatsApp notification sent

**Expected output:**
- Concerts queried from APIs
- New concerts added to database
- Notification sent if applicable

---

### Test Feedback Collection Workflow

1. Manually create unrated visit in database
2. Wait for Monday 8pm (or execute manually)
3. Verify WhatsApp message sent asking for rating

**Expected output:**
- Workflow detects unrated visit
- WhatsApp message sent
- Response parsed and saved to database

---

## Testing WhatsApp Bot

### Test Conversation Flow

Send these messages to the bot:

1. **"What should we do this Saturday?"**
   - Expected: 3 activity suggestions

2. **"Tell me more about option 1"**
   - Expected: Detailed info about first activity

3. **"We went to Frog Park yesterday, kids loved it 5/5"**
   - Expected: Confirmation message, visit logged in database

4. **"Find Mexican restaurants near Heather Farms"**
   - Expected: List of celiac-safe Mexican restaurants

---

## Integration Testing

### End-to-End Weekend Planning Flow

1. **Thursday noon**: Weekly suggestions workflow runs
2. **User receives**: WhatsApp message with 3 suggestions
3. **User asks**: "Tell me more about option 2"
4. **Bot responds**: Detailed information
5. **User confirms**: "Let's do option 2 on Saturday"
6. **Bot responds**: Confirmation and reminders
7. **Saturday**: Family does activity
8. **Monday 8pm**: Bot asks for rating
9. **User provides**: Rating and notes
10. **Bot confirms**: Rating saved

**Verify:**
- All messages sent/received correctly
- Database updated at each step
- Next week's suggestions incorporate this rating

---

## Performance Testing

### API Response Times

Monitor these:
- MCP tool calls: < 2 seconds
- Database queries: < 500ms
- External API calls: < 5 seconds

### n8n Workflow Execution Times

- Weekly Suggestions: < 30 seconds
- Spotify Sync: < 10 seconds
- Concert Discovery: < 20 seconds
- Event Discovery: < 60 seconds
- Feedback Collection: < 5 seconds
- Ticket Reminders: < 10 seconds

---

## Debugging Tips

### MCP Server Not Responding

1. Check server logs: `npm run dev`
2. Verify `.env` file has all required keys
3. Check Supabase connection
4. Test tool directly in TypeScript

### n8n Workflow Failing

1. Check workflow execution log
2. Verify all credentials configured
3. Test each node independently
4. Check API rate limits

### WhatsApp Not Sending

1. Verify webhook configured correctly
2. Check WhatsApp API credentials
3. Test with curl/Postman first
4. Check n8n webhook logs

### Database Query Slow

1. Check for missing indexes
2. Use EXPLAIN ANALYZE in SQL
3. Consider materialized views
4. Check Supabase metrics

---

*Update this guide as new testing patterns emerge.*
