# Implementation Guide - MCP Servers

**Purpose:** Step-by-step guide for implementing the 5 MCP servers

---

## Overview

We have 5 MCP servers using **direct tool calling (Option B)**:

```
Orchestrator (main coordinator)
    ↓ (directly imports and calls)
├── Activity Planner tools
├── Music Scout tools
├── Food Finder tools
└── Schedule Sync tools
```

---

## Implementation Order (Recommended)

1. **Schedule Sync** (easiest, no complex logic)
2. **Food Finder** (simple filtering, good for learning pattern)
3. **Activity Planner** (core logic, most important)
4. **Music Scout** (requires Spotify OAuth, can be last)
5. **Orchestrator** (coordinates all others, do last)

---

## 1. Schedule Sync MCP Server

### Purpose
Calendar integration, weather checking, route optimization

### Tools to Implement

#### `check_calendar_conflicts(date_range: string[])`
```typescript
// Returns calendar events that conflict with proposed dates
// 1. Connect to Google Calendar API
// 2. Query events in date range
// 3. Return list of conflicts with times
// 4. Format: { date, time, event_name, duration }
```

**Implementation steps:**
1. Install `googleapis` package
2. Load Google Calendar credentials from .env
3. Use OAuth refresh token to get access token
4. Query Calendar API for events in range
5. Parse and return conflicts

**Expected output:**
```json
{
  "conflicts": [
    {
      "date": "2025-10-12",
      "time": "10:00",
      "event": "Swim Lesson",
      "duration_minutes": 60
    }
  ]
}
```

#### `get_weather_forecast(date: string, location: string)`
```typescript
// Returns weather forecast for date/location
// 1. Use Weather.gov API (free, no key) or OpenWeatherMap
// 2. Query forecast for Oakland, CA (or provided location)
// 3. Return: temperature, conditions, precipitation chance
```

**Implementation steps:**
1. Choose API (Weather.gov recommended - free, no key)
2. Get lat/lon for location (37.8324, -122.2128 for Oakland 94611)
3. Fetch forecast for date
4. Parse and return formatted weather

**Expected output:**
```json
{
  "date": "2025-10-12",
  "high_temp": 72,
  "low_temp": 58,
  "conditions": "Sunny",
  "precipitation_chance": 10,
  "suitable_for_outdoor": true
}
```

#### `calculate_drive_time(origin: string, destination: string)`
```typescript
// Returns drive time in minutes
// For v1: Use pre-calculated drive times from activities table
// For v2: Integrate Google Maps Distance Matrix API
```

**Implementation steps (v1):**
1. Query Supabase activities/restaurants table
2. Return pre-calculated drive_time_minutes field
3. Apply exponential decay if > 30 minutes

**Expected output:**
```json
{
  "origin": "Oakland 94611",
  "destination": "Tilden Park",
  "drive_time_minutes": 25,
  "distance_miles": 12,
  "within_comfort_zone": true
}
```

#### `optimize_route(activities: Activity[])`
```typescript
// Returns optimized order for multiple activities
// Simple v1: Sort by drive time, minimize backtracking
```

**Implementation steps:**
1. Take array of activities with lat/lon
2. Sort to minimize total drive time
3. Calculate cumulative time
4. Return ordered list with timing

#### `suggest_timing(activities: Activity[], buffers: boolean)`
```typescript
// Creates timeline for day with realistic buffers
// Include: drive time, activity duration, meal times, buffer for transitions
```

**Expected output:**
```json
{
  "timeline": [
    {
      "time": "09:00",
      "activity": "Leave home",
      "duration_minutes": 25,
      "type": "drive"
    },
    {
      "time": "09:25",
      "activity": "Tilden Little Farm",
      "duration_minutes": 60,
      "type": "activity"
    },
    {
      "time": "10:25",
      "activity": "Walk to Steam Trains",
      "duration_minutes": 10,
      "type": "transition"
    },
    {
      "time": "10:35",
      "activity": "Tilden Steam Trains",
      "duration_minutes": 30,
      "type": "activity"
    },
    {
      "time": "11:05",
      "activity": "Drive to lunch",
      "duration_minutes": 15,
      "type": "drive"
    },
    {
      "time": "11:20",
      "activity": "Lunch at Comal",
      "duration_minutes": 60,
      "type": "meal"
    }
  ]
}
```

---

## 2. Food Finder MCP Server

### Purpose
Restaurant recommendations with dietary restrictions

### Tools to Implement

#### `find_restaurants(cuisine: string, dietary_needs: string[], location: string)`
```typescript
// Returns restaurants matching criteria
// CRITICAL: Must filter by dietary restrictions
```

**Implementation steps:**
1. Query Supabase restaurants table
2. Filter by cuisine (if provided)
3. **CRITICAL FILTERS:**
   - WHERE celiac_safe = true (always for wife)
   - WHERE sesame_free_options = true (for daughter)
   - WHERE cashew_free_options = true (for daughter)
   - WHERE flax_free_options = true (for daughter)
4. Filter by location/drive time
5. Order by avg_rating DESC
6. Return top 5-10 matches

**Expected output:**
```json
{
  "restaurants": [
    {
      "id": "uuid",
      "name": "Cholita Linda",
      "cuisine": "mexican",
      "address": "4923 Telegraph Ave, Oakland",
      "drive_time_minutes": 12,
      "celiac_safe": true,
      "dietary_safe_for": ["celiac", "sesame", "cashew", "flax"],
      "avg_rating": 4.5,
      "price_range": "$",
      "notes": "Good for lunch after Heather Farms"
    }
  ]
}
```

#### `match_restaurant_to_activity(activity_id: string, meal_time: string)`
```typescript
// Find restaurants near an activity
// 1. Get activity location from Supabase
// 2. Find restaurants in same city or within 10 min drive
// 3. Apply dietary filters
// 4. Consider meal timing (breakfast vs lunch vs dinner)
```

#### `get_restaurant_details(restaurant_id: string)`
```typescript
// Get full details for a restaurant
// 1. Query Supabase by ID
// 2. Return all fields including allergen notes
```

#### `check_dietary_safety(restaurant_id: string, restrictions: string[])`
```typescript
// Verify restaurant is safe for specific dietary restrictions
// 1. Query restaurant allergen flags
// 2. Check allergen_notes for warnings
// 3. Return safety assessment
```

**Expected output:**
```json
{
  "restaurant": "Dosa",
  "safe_for": {
    "celiac": true,
    "sesame": false,
    "cashew": false,
    "flax": true
  },
  "warnings": [
    "⚠️ CRITICAL: Cashews commonly used in Indian cuisine. Must notify server.",
    "⚠️ Some dishes contain sesame seeds. Ask before ordering."
  ],
  "recommendation": "CAUTION - Not recommended due to cashew allergy risk"
}
```

---

## 3. Activity Planner MCP Server

### Purpose
Kid activity suggestions with age-appropriate filtering

### Tools to Implement

#### `query_activities(filters: ActivityFilters)`
```typescript
interface ActivityFilters {
  weather?: string;          // 'sunny', 'rainy', 'any'
  age_range?: [number, number];  // [3, 5]
  category?: string;         // 'park', 'museum', etc.
  indoor_outdoor?: string;   // 'indoor', 'outdoor', 'both'
  max_drive_time?: number;   // minutes
  tags?: string[];           // ['active', 'creative', etc.]
}

// Returns activities matching all filters
```

**Implementation steps:**
1. Build SQL query with WHERE clauses for each filter
2. **Age filtering:** WHERE age_min <= 5 AND age_max >= 3
3. **Weather filtering:**
   - If rainy: WHERE weather_dependent = false OR indoor_outdoor = 'indoor'
   - If sunny: No weather restriction
4. **Drive time:** Apply exponential decay past 30 min
5. Join with visits table to get rating history
6. Calculate novelty score (days since last visit)
7. Return weighted results

**Expected output:**
```json
{
  "activities": [
    {
      "id": "uuid",
      "name": "Frog Park",
      "category": "park",
      "drive_time_minutes": 15,
      "last_visited_days_ago": 21,
      "avg_rating_3yo": 5,
      "avg_rating_5yo": 5,
      "novelty_score": 0.7,
      "total_score": 4.2,
      "why_suggested": "Kids loved it last time. Good weather. Haven't been in 3 weeks."
    }
  ]
}
```

#### `suggest_activity_chain(date: string, duration: number, preferences: object)`
```typescript
// Suggest 2-3 activities that work well together
// 1. Query compatible activities (similar location, complementary types)
// 2. Ensure total time fits duration
// 3. Include variety (e.g., active + calm, outdoor + indoor backup)
// 4. Check if they've been done together before
```

**Activity pairing logic:**
- Same city/area (minimize driving)
- Complementary energy levels (high → medium → low)
- Different types (park + museum + restaurant)
- Weather backup (outdoor primary + indoor backup)

**Expected output:**
```json
{
  "chain": [
    {
      "order": 1,
      "activity_id": "uuid",
      "name": "Tilden Little Farm",
      "duration_minutes": 60,
      "type": "outdoor",
      "energy_level": "low"
    },
    {
      "order": 2,
      "activity_id": "uuid",
      "name": "Tilden Steam Trains",
      "duration_minutes": 30,
      "type": "outdoor",
      "energy_level": "medium"
    },
    {
      "order": 3,
      "activity_id": "uuid",
      "name": "Lawrence Hall of Science",
      "duration_minutes": 90,
      "type": "indoor",
      "energy_level": "medium",
      "note": "Rain backup option"
    }
  ],
  "total_time_estimate": "4 hours",
  "rationale": "All in Berkeley area (minimize driving). Mix of outdoor + indoor. Good energy flow."
}
```

#### `check_opening_hours(activity_id: string, date: string)`
```typescript
// Check if activity is open on date
// 1. Query activity.opening_hours JSON field
// 2. Parse for day of week
// 3. Check if open
// 4. Return hours
```

#### `get_standbys(last_visit_days_ago: number)`
```typescript
// Get "rotation favorites" - activities to revisit
// 1. Query visits WHERE rating_overall >= 4 AND would_return = true
// 2. Filter by last_visited_at (suggest if > X days)
// 3. Prefer activities visited 3-6 weeks ago
// 4. Return with "good to revisit" messaging
```

**Expected output:**
```json
{
  "standbys": [
    {
      "activity": "Frog Park",
      "last_visited": "2025-09-18",
      "days_ago": 21,
      "avg_rating": 5,
      "why_revisit": "Kids loved it. Haven't been in 3 weeks. Farmers market on Saturdays."
    }
  ]
}
```

---

## 4. Music Scout MCP Server

### Purpose
Concert discovery via Spotify listening history

### Tools to Implement

#### `sync_spotify_preferences(user_id: string)`
```typescript
// Sync top artists from Spotify
// Requires Spotify OAuth setup first!
```

**Prerequisite: Spotify OAuth Setup**
1. Create Spotify Developer app
2. Get client_id and client_secret
3. Implement OAuth flow to get refresh token
4. Store refresh token in Supabase or .env

**Implementation steps:**
1. Load refresh token for user_id ('david' or 'wife')
2. Exchange refresh token for access token
3. Call Spotify API: /me/top/artists?time_range=short_term&limit=50
4. Call again for medium_term
5. Upsert to artist_preferences table
6. Update play counts and last_played_at

**Expected output:**
```json
{
  "synced": 50,
  "user": "wife",
  "top_artists": ["Dashboard Confessional", "Goo Goo Dolls", "The National"],
  "updated_at": "2025-10-09T12:00:00Z"
}
```

#### `find_concerts(artists: string[], location: string, months_ahead: number)`
```typescript
// Find concerts for artists in location
// APIs: Songkick and/or Bandsintown
```

**Implementation steps:**
1. For each artist in list:
   - Query Songkick API for artist events
   - Query Bandsintown API for artist events
2. Filter by location (within 90 min of Oakland)
3. Filter by date (next X months)
4. Calculate relevance_score based on play counts
5. Dedupe and insert into concerts table
6. Return new discoveries

**Expected output:**
```json
{
  "new_concerts": [
    {
      "artist": "Dashboard Confessional",
      "venue": "The Fillmore",
      "date": "2025-11-15",
      "ticket_url": "https://...",
      "relevance_score": 0.9,
      "why_relevant": "Wife has listened 47 times in last month"
    }
  ]
}
```

#### `get_concert_details(concert_id: string)`
```typescript
// Get full concert details from database
```

#### `check_ticket_availability(concert_id: string)`
```typescript
// Check if tickets still available
// v1: Return ticket_url
// v2: Actually check ticket site
```

---

## 5. Orchestrator MCP Server

### Purpose
Coordinate all subagents and format responses

### Tools to Implement

#### `plan_weekend(date: string, preferences: object)`

**Complete implementation flow:**

```typescript
async function planWeekend(args) {
  // 1. Get schedule and weather
  const schedule = await scheduleSync.checkCalendar([args.date]);
  const weather = await scheduleSync.getWeatherForecast(args.date, 'Oakland, CA');

  // 2. Get activity suggestions (3 different ones)
  const activities = await activityPlanner.queryActivities({
    weather: weather.conditions,
    age_range: [3, 5],
    max_drive_time: 90,
    ...args.preferences
  });

  // Get mix of new + standbys
  const standbys = await activityPlanner.getStandbys(14); // 2+ weeks ago

  // Create 3 suggestions mixing novelty + standbys
  const suggestions = [];

  for (let i = 0; i < 3; i++) {
    // Pick 2-3 activities for each suggestion
    const chain = await activityPlanner.suggestActivityChain(
      args.date,
      240, // 4 hours
      args.preferences
    );

    // For each activity, find restaurant
    const withRestaurants = await Promise.all(
      chain.map(async (activity) => {
        const restaurants = await foodFinder.matchRestaurantToActivity(
          activity.id,
          'lunch'
        );
        return { ...activity, restaurants };
      })
    );

    // Optimize route and timing
    const optimized = await scheduleSync.optimizeRoute(withRestaurants);
    const timeline = await scheduleSync.suggestTiming(optimized, true);

    suggestions.push({
      option: i + 1,
      activities: withRestaurants,
      timeline: timeline,
      weather_plan: weather,
      conflicts: schedule.conflicts
    });
  }

  // 3. Format for WhatsApp
  return formatSuggestionsForWhatsApp(suggestions);
}
```

**Expected output (formatted for WhatsApp):**
```
🎪 Weekend Suggestions for Saturday, Oct 12

Weather: ☀️ 72°F, Sunny (perfect outdoor weather!)

━━━━━━━━━━━━━━━━━━━━
Option 1: Tilden Park Adventure
━━━━━━━━━━━━━━━━━━━━

🌳 Morning (9:00-11:00)
• Tilden Little Farm (free, 25 min drive)
  See animals, feed goats
  Kids loved this! Last visit: 8 weeks ago

🚂 Late Morning (11:00-11:30)
• Tilden Steam Trains ($4/person)
  Scenic train ride through redwoods

🍽️ Lunch (12:00-1:00)
• Comal (Berkeley, 10 min)
  Mexican, celiac-safe ✓
  All allergens safe ✓
  $$, reservations recommended

Total time: ~4 hours
Total cost: ~$50 for family

[Reply '1' for more details]

━━━━━━━━━━━━━━━━━━━━
Option 2: [...]
Option 3: [...]
```

---

## Data Flow Example

### Complete Weekend Planning Flow:

```
User (WhatsApp): "What should we do Saturday?"
    ↓
n8n webhook receives message
    ↓
n8n calls Orchestrator.plan_weekend("2025-10-12")
    ↓
Orchestrator → ScheduleSync.checkCalendar()
    ↓ returns: "Swim lesson 10-11am"
Orchestrator → ScheduleSync.getWeather()
    ↓ returns: "Sunny, 72°F"
Orchestrator → ActivityPlanner.queryActivities({weather: 'sunny'})
    ↓ returns: [Tilden, Frog Park, Adventure Playground, ...]
Orchestrator → ActivityPlanner.suggestActivityChain()
    ↓ returns: [Little Farm, Steam Trains, Lawrence Hall]
Orchestrator → FoodFinder.matchRestaurantToActivity(Little Farm)
    ↓ returns: [Comal, Tacubaya, Comal]
Orchestrator → ScheduleSync.optimizeRoute([activities])
    ↓ returns: Optimized order
Orchestrator → ScheduleSync.suggestTiming([activities])
    ↓ returns: Complete timeline
Orchestrator formats response
    ↓
Returns to n8n
    ↓
n8n sends WhatsApp message
    ↓
User receives 3 formatted suggestions
```

---

## Testing Each Server

### Unit Testing Pattern:

```typescript
// Test individual tools
async function testScheduleSync() {
  console.log('Testing check_calendar...');
  const result = await checkCalendar(['2025-10-12', '2025-10-13']);
  console.log(JSON.stringify(result, null, 2));

  console.log('Testing get_weather...');
  const weather = await getWeatherForecast('2025-10-12', 'Oakland, CA');
  console.log(JSON.stringify(weather, null, 2));
}
```

### Integration Testing:

```bash
# Test via Claude Code CLI
claude code

# Use tool
> Use schedule_sync tool: check_calendar(["2025-10-12"])
```

---

## Common Patterns

### Supabase Query Pattern:
```typescript
const { data, error } = await supabase
  .from('activities')
  .select('*')
  .eq('category', 'park')
  .gte('age_max', 3)
  .lte('age_min', 5)
  .order('avg_rating', { ascending: false });

if (error) throw error;
return data;
```

### Error Handling Pattern:
```typescript
try {
  const result = await someAsyncOperation();
  return JSON.stringify({ success: true, data: result }, null, 2);
} catch (error) {
  console.error('Error in tool:', error);
  return JSON.stringify({
    success: false,
    error: error.message
  }, null, 2);
}
```

---

## Critical Implementation Notes

### Dietary Restrictions (CRITICAL!)
**ALWAYS filter restaurants by ALL dietary restrictions:**
```sql
WHERE celiac_safe = true
  AND sesame_free_options = true
  AND cashew_free_options = true
  AND flax_free_options = true
```

Never suggest a restaurant that doesn't meet ALL requirements.

### Drive Time Exponential Decay
```typescript
function applyDriveTimeScore(drive_time_minutes: number): number {
  if (drive_time_minutes <= 30) return 1.0;
  if (drive_time_minutes <= 60) return 0.5;
  if (drive_time_minutes <= 90) return 0.2;
  return 0; // Don't suggest > 90 min
}
```

### Age-Specific Ratings
Always use separate ratings:
- `rating_3yo` for 3-year-old preferences
- `rating_5yo` for 5-year-old preferences
- `rating_overall` for family rating

Calculate: `(rating_3yo + rating_5yo) / 2` for family score.

---

*This guide provides the blueprint for implementing all 5 MCP servers. Follow the patterns and you'll have a working system!*
