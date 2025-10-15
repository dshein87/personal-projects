# META-PLAN: 3 Remaining MCP Servers

**Created:** 2025-10-14
**Purpose:** Comprehensive parallel implementation strategy for Activity Planner, Schedule Sync, and Orchestrator MCPs
**Status:** Ready for autonomous multi-subagent execution

---

## 🎯 Executive Summary

This meta-plan enables **context-free autonomous execution** of the 3 remaining MCP servers using proven patterns from Food Finder. Designed for:
- Parallel multi-subagent builds
- Clear success criteria
- Security-first implementation
- ~13 hours total work → ~6-8 hours wall clock time with parallelization

**Key Innovation:** Use Food Finder (1,020 lines, production-ready) as template for all 3 servers.

---

## 📊 Overview: 3 Remaining Servers

| Server | Priority | Est. Time | Dependencies | Parallel? |
|--------|----------|-----------|--------------|-----------|
| **Activity Planner** | HIGH | 4 hours | Database only | ✅ Yes (with Schedule Sync) |
| **Schedule Sync** | MEDIUM | 3 hours | Database, Weather API | ✅ Yes (with Activity Planner) |
| **Orchestrator** | HIGH | 6 hours | Both above servers | ❌ No (must be sequential) |

**Total:** 13 hours sequential, ~8 hours with parallelization

---

## 🧠 Lessons Learned from Food Finder

### ✅ What Worked Exceptionally Well

#### 1. Security-First Approach
**Pattern:** Implement security utilities BEFORE tool logic.

```typescript
// Establish these patterns FIRST:
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validateUUID(uuid: string): boolean {
  return typeof uuid === 'string' && UUID_REGEX.test(uuid);
}

function sanitizeError(error: unknown): string {
  // Never expose stack traces or internal details
  return 'An error occurred while processing your request';
}

// Environment validation on startup (fail-fast)
function validateEnvironment(): void {
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing: ${missing.join(', ')}`);
  }
}
```

**Apply to:**
- Activity Planner: Validate activity_id, age_min/max, drive_time
- Schedule Sync: Validate dates, city names, coordinates
- Orchestrator: Validate all user inputs, sanitize subagent responses

---

#### 2. Type Definitions Drive Implementation
**Pattern:** Define interfaces FIRST, let TypeScript autocomplete guide development.

```typescript
// Define these upfront:
interface Activity {
  id: string;
  name: string;
  city: string;
  age_min: number;
  age_max: number;
  drive_time_minutes: number | null;
  indoor_outdoor: 'indoor' | 'outdoor' | 'both';
  avg_rating: number | null;
  times_visited: number;
  // ... all 18 fields
}

interface QueryActivitiesArgs {
  age_min?: number;
  age_max?: number;
  max_drive_time?: number;
  indoor_outdoor?: string;
  city?: string;
  limit?: number;
}
```

**Benefits:**
- Autocomplete guides development
- Catches type errors at compile time
- Self-documenting code
- Easy to test

**Apply to:**
- Activity Planner: Activity, ScoredActivity, SuggestionResult
- Schedule Sync: WeatherForecast, CalendarEvent, TimingSuggestion
- Orchestrator: PlanRequest, DayPlan, WeekendSuggestion

---

#### 3. Four-Tool Focused Design
**Pattern:** Multiple focused tools beats one monolithic tool.

**Food Finder:**
- find_restaurants (search/filter)
- get_restaurant_details (single record)
- check_dietary_safety (explicit assessment)
- match_restaurant_to_activity (coordination)

**Why it works:**
- Clear intent (tool name = purpose)
- Easier testing (isolated functionality)
- Better error handling (precise failures)
- Composable (orchestrator combines them)

**Apply to:**
- Activity Planner: query_activities, suggest_activity_chain, get_activity_details, check_opening_hours
- Schedule Sync: check_calendar_conflicts, get_weather_forecast, calculate_drive_time, suggest_timing
- Orchestrator: plan_weekend, get_day_plan, answer_question

---

#### 4. Double-Cast Pattern for MCP SDK
**Pattern:** TypeScript strict mode requires `as any as CustomType` for tool arguments.

```typescript
// MCP SDK types request.params.arguments as Record<string, unknown> | undefined
// This fails:
const args = request.params.arguments as QueryActivitiesArgs;

// This works:
const args = request.params.arguments as any as QueryActivitiesArgs;
```

**Why necessary:**
- SDK can't verify shape at compile time
- Runtime validation happens in handlers
- Standard pattern across all MCP servers

**Apply to:** ALL tool handlers in all 3 servers

---

#### 5. Query Builder Only (No Raw SQL)
**Pattern:** ALWAYS use Supabase query builder, NEVER concatenate raw SQL.

```typescript
// ✅ GOOD - Parameterized via query builder:
const { data } = await supabase
  .from('activities')
  .select('*')
  .eq('city', args.city)
  .lte('age_min', 5)
  .gte('age_max', 3)
  .order('avg_rating', { ascending: false });

// ❌ BAD - SQL injection risk:
const query = `SELECT * FROM activities WHERE city = '${args.city}'`;
```

**Benefits:**
- Automatic SQL injection prevention
- Type-safe return values
- Clearer code
- Database-agnostic

**Apply to:** All database queries in all 3 servers

---

#### 6. Build Testing After Each Tool
**Pattern:** Run `npm run build` after implementing each tool.

**Why it matters:**
- Catches type errors immediately
- Faster feedback loop than integration testing
- Builds confidence before moving to next tool
- Prevents accumulating errors

**Apply to:** Run build after EVERY tool implementation

---

###  Issues Encountered & Solutions

#### Issue: TypeScript Type Assertion Errors
**Problem:** Direct casting from `Record<string, unknown>` to custom interfaces fails.
**Solution:** Use double-cast pattern `as any as CustomType`.
**Prevention:** Use this pattern from the start in all tool handlers.

#### Issue: Environment Path Complexity
**Problem:** Relative path `../../.env` fragile with nested directories.
**Solution:** Use consistent path calculation `../../../.env` from src/.
**Better Solution:** Set `PROJECT_ROOT` environment variable in `.mcp.json`.

#### Issue: Cuisine Whitelist Validation
**Problem:** User-provided strings could enable SQL injection.
**Solution:** Validate against whitelist BEFORE using in queries.
**Apply to:** Validate ALL user strings (city names, activity types, etc.)

---

## 🏗️ Parallel Implementation Strategy

### Phase 1: Parallel Server Building (6 hours wall clock)

**Spawn 2 parallel subagents:**

```
Subagent A: Activity Planner (4 hours)
│
├─ Tool 1: query_activities
├─ Tool 2: suggest_activity_chain
├─ Tool 3: get_activity_details
└─ Tool 4: check_opening_hours

Subagent B: Schedule Sync (3 hours)
│
├─ Tool 1: check_calendar_conflicts
├─ Tool 2: get_weather_forecast
├─ Tool 3: calculate_drive_time
└─ Tool 4: suggest_timing
```

**Both subagents work simultaneously, no dependencies between them.**

---

### Phase 2: Sequential Orchestrator (6 hours)

**Requires:** Activity Planner ✅ + Schedule Sync ✅

```
Orchestrator (6 hours) - MUST BE SEQUENTIAL
│
├─ Tool 1: plan_weekend (coordinates all subagents)
├─ Tool 2: get_day_plan (detailed single-day plan)
└─ Tool 3: answer_question (Q&A routing)
```

**Cannot parallelize:** Orchestrator imports from both servers.

---

### Phase 3: Integration Testing (2 hours)

**End-to-end validation:**
1. Test each server standalone
2. Test orchestrator coordination
3. Test full weekend planning flow
4. Test error handling

---

## 📋 ACTIVITY PLANNER: Detailed Implementation Plan

### Overview
**Purpose:** Core recommendation engine for kid activities
**Priority:** HIGH (most important server)
**Time:** 4 hours
**Dependencies:** Database, rating data (visits table)
**Parallelizable:** YES (with Schedule Sync)

---

### Tool 1: query_activities

**Purpose:** Basic activity search and filtering

**Signature:**
```typescript
interface QueryActivitiesArgs {
  age_min?: number;          // Filter: age_min <= this value
  age_max?: number;          // Filter: age_max >= this value
  max_drive_time?: number;   // Filter: drive_time_minutes <= this value
  indoor_outdoor?: string;   // Filter: 'indoor' | 'outdoor' | 'both'
  city?: string;             // Filter: exact city match
  limit?: number;            // Default: 10, Max: 50
}

interface QueryActivitiesResult {
  activities: Activity[];
  total_count: number;
}
```

**Implementation Steps:**
1. Validate inputs:
   - age_min/age_max: 0-18 range
   - max_drive_time: 0-180 minutes
   - indoor_outdoor: whitelist ['indoor', 'outdoor', 'both']
   - city: whitelist ['Oakland', 'Berkeley', 'Walnut Creek', ...]
   - limit: 1-50

2. Build query:
   ```typescript
   let query = supabase
     .from('activities')
     .select('*');

   if (args.age_min) query = query.lte('age_min', args.age_min);
   if (args.age_max) query = query.gte('age_max', args.age_max);
   if (args.max_drive_time) query = query.lte('drive_time_minutes', args.max_drive_time);
   if (args.indoor_outdoor) query = query.eq('indoor_outdoor', args.indoor_outdoor);
   if (args.city) query = query.eq('city', args.city);

   query = query
     .order('avg_rating', { ascending: false, nullsFirst: false })
     .order('times_visited', { ascending: false })
     .limit(args.limit || 10);
   ```

3. Return formatted results

**Security:**
- Validate age ranges
- Whitelist indoor_outdoor values
- Whitelist city names
- Cap limit at 50

---

### Tool 2: suggest_activity_chain

**Purpose:** Main recommendation engine with scoring algorithm

**Signature:**
```typescript
interface SuggestActivityChainArgs {
  date: string;              // ISO date format
  num_suggestions?: number;  // Default: 3
  weather_condition?: string; // 'sunny' | 'rainy' | 'cold' | 'hot'
  attendees?: string[];      // ['3yo', '5yo'] or subset
}

interface ScoredActivity extends Activity {
  score: number;
  score_breakdown: {
    rating_component: number;
    novelty_component: number;
    drive_time_component: number;
    age_match_component: number;
    weather_component: number;
  };
}

interface SuggestionResult {
  suggestions: ScoredActivity[];
  metadata: {
    date: string;
    weather: string;
    attendees: string[];
  };
}
```

**Scoring Algorithm:**
```typescript
function scoreActivity(activity: Activity, visits: Visit[], args: SuggestActivityChainArgs): number {
  // 1. Rating component (0-1 scale)
  const rating_weight = 0.4;
  const rating_score = (activity.avg_rating || 0.5); // Default 0.5 if no ratings

  // 2. Novelty component (0-1 scale)
  const novelty_weight = 0.3;
  const visits_count = visits.filter(v => v.activity_id === activity.id).length;
  const visit_frequency = Math.min(visits_count / 10, 1.0); // Normalize to 0-1
  const novelty_score = 1.0 - visit_frequency;

  // 3. Drive time component (0-1 scale, exponential decay past 30min)
  const drive_weight = 0.2;
  const drive_time = activity.drive_time_minutes || 30;
  const drive_score = drive_time <= 30
    ? 1.0
    : Math.exp(-(drive_time - 30) / 30);

  // 4. Age match component (0-1 scale)
  const age_weight = 0.05;
  const age_match = (activity.age_min <= 3 && activity.age_max >= 5) ? 1.0 : 0.5;

  // 5. Weather component (0-1 scale)
  const weather_weight = 0.05;
  const weather_match = matchWeather(activity.indoor_outdoor, args.weather_condition);

  // Combine
  const total_score =
    (rating_weight * rating_score) +
    (novelty_weight * novelty_score) +
    (drive_weight * drive_score) +
    (age_weight * age_match) +
    (weather_weight * weather_match);

  return total_score;
}

function matchWeather(type: string, weather?: string): number {
  if (!weather) return 0.5; // Neutral
  if (weather === 'rainy' && type !== 'outdoor') return 1.0;
  if (weather === 'sunny' && type !== 'indoor') return 1.0;
  if (weather === 'cold' && type === 'indoor') return 1.0;
  if (weather === 'hot' && type !== 'outdoor') return 1.0;
  return 0.3; // Slight penalty for mismatch
}
```

**Implementation Steps:**
1. Validate inputs (date format, weather whitelist, attendees whitelist)
2. Query ALL activities from database
3. Query visit history for scoring
4. Score each activity using algorithm above
5. Sort by score descending
6. Return top N (default 3)
7. Include score breakdown for transparency

**Security:**
- Validate date format (YYYY-MM-DD)
- Whitelist weather_condition
- Whitelist attendees
- Cap num_suggestions at 10

---

### Tool 3: get_activity_details

**Purpose:** Full details for a single activity

**Signature:**
```typescript
interface GetActivityDetailsArgs {
  activity_id: string;  // UUID
}

interface ActivityDetailsResult extends Activity {
  visit_history: Visit[];
  last_visited: string | null;
  total_visits: number;
  family_notes: string[];
}
```

**Implementation Steps:**
1. Validate UUID format
2. Query activity by ID
3. Query visit history for this activity
4. Aggregate visit data
5. Return complete details

**Security:**
- UUID validation before query
- Error sanitization (don't expose "record not found" with ID)

---

### Tool 4: check_opening_hours

**Purpose:** Verify activity is open on a given date/time

**Signature:**
```typescript
interface CheckOpeningHoursArgs {
  activity_id: string;
  date: string;         // YYYY-MM-DD
  time?: string;        // HH:MM (optional)
}

interface OpeningHoursResult {
  is_open: boolean | null;  // null = unknown
  opening_time: string | null;
  closing_time: string | null;
  notes: string;
}
```

**v1 Implementation (Stub):**
```typescript
// v1: Always return unknown
return {
  is_open: null,
  opening_time: null,
  closing_time: null,
  notes: 'Opening hours data not available in v1. Check activity website or call ahead.'
};
```

**v2 Implementation (Future):**
- Add opening_hours table
- Parse hours by day of week
- Handle special cases (holidays, seasonal closures)

**Security:**
- UUID validation
- Date format validation

---

### Security Checklist for Activity Planner

- [ ] UUID validation for all activity_id parameters
- [ ] Date format validation (YYYY-MM-DD regex)
- [ ] Age range validation (0-18)
- [ ] Drive time validation (0-180)
- [ ] Indoor/outdoor whitelist: ['indoor', 'outdoor', 'both']
- [ ] City whitelist: ['Oakland', 'Berkeley', 'Walnut Creek', 'Lafayette', 'Orinda', 'SF']
- [ ] Weather whitelist: ['sunny', 'rainy', 'cold', 'hot', 'mild']
- [ ] Attendees whitelist: ['3yo', '5yo', 'both']
- [ ] Limit caps (query: 50, suggestions: 10)
- [ ] Error sanitization (no stack traces)
- [ ] Environment validation on startup
- [ ] Query builder only (no raw SQL)

---

### Testing Checklist for Activity Planner

**Build Tests:**
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds (no TypeScript errors)
- [ ] `npx tsc --noEmit` passes

**Unit Tests:**
- [ ] query_activities: Returns activities for age range 3-5
- [ ] query_activities: Filters by max_drive_time correctly
- [ ] query_activities: Indoor/outdoor filtering works
- [ ] suggest_activity_chain: Returns 3 scored suggestions
- [ ] suggest_activity_chain: Scores include all 5 components
- [ ] suggest_activity_chain: Weather matching affects scores
- [ ] get_activity_details: Returns full activity + visit history
- [ ] check_opening_hours: Returns unknown (v1 stub)

**Edge Cases:**
- [ ] Invalid UUID → proper error message
- [ ] No activities match filters → empty array
- [ ] Missing visit data → scores still work (default 0.5 rating)
- [ ] Age mismatch → partial match (0.5 age component)

---

## 📋 SCHEDULE SYNC: Detailed Implementation Plan

### Overview
**Purpose:** Calendar conflicts, weather, drive time, and timing suggestions
**Priority:** MEDIUM
**Time:** 3 hours
**Dependencies:** Database, Weather.gov API (FREE)
**Parallelizable:** YES (with Activity Planner)

---

### Tool 1: check_calendar_conflicts

**Purpose:** Check if date/time has calendar conflicts

**Signature:**
```typescript
interface CheckCalendarConflictsArgs {
  start_date: string;  // YYYY-MM-DD
  end_date: string;    // YYYY-MM-DD
  time_range?: {
    start: string;     // HH:MM
    end: string;       // HH:MM
  };
}

interface CalendarConflictResult {
  has_conflicts: boolean;
  conflicts: CalendarEvent[];
}

interface CalendarEvent {
  title: string;
  start: string;  // ISO 8601
  end: string;    // ISO 8601
  location?: string;
}
```

**v1 Implementation (Stub):**
```typescript
// v1: Always return no conflicts
return {
  has_conflicts: false,
  conflicts: [],
  note: 'Calendar integration not available in v1. Check your calendar manually.'
};
```

**v2 Implementation (Future):**
- Google Calendar API integration
- OAuth token from environment
- Query family calendar
- Return actual conflicts

**Security:**
- Date format validation
- Time format validation (HH:MM)

---

### Tool 2: get_weather_forecast

**Purpose:** Fetch weather forecast for date and location

**Signature:**
```typescript
interface GetWeatherForecastArgs {
  date: string;        // YYYY-MM-DD
  city: string;        // 'Oakland' | 'Berkeley' | etc.
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

interface WeatherForecastResult {
  date: string;
  city: string;
  condition: string;      // 'sunny' | 'rainy' | 'cloudy' | 'cold' | 'hot'
  temperature_high: number | null;
  temperature_low: number | null;
  precipitation_chance: number | null;
  summary: string;
  source: string;         // 'weather.gov'
}
```

**Implementation (Weather.gov API):**
```typescript
// 1. Map city to coordinates
const CITY_COORDS = {
  'Oakland': { lat: 37.8044, lon: -122.2712 },
  'Berkeley': { lat: 37.8715, lon: -122.2730 },
  'Walnut Creek': { lat: 37.9101, lon: -122.0652 },
  'San Francisco': { lat: 37.7749, lon: -122.4194 },
  // ...
};

// 2. Call Weather.gov API
// Endpoint: https://api.weather.gov/points/{latitude},{longitude}
// Then: Follow forecast URL
const coords = args.coordinates || CITY_COORDS[args.city];
const pointsUrl = `https://api.weather.gov/points/${coords.lat},${coords.lon}`;
const pointsResponse = await fetch(pointsUrl);
const pointsData = await pointsResponse.json();
const forecastUrl = pointsData.properties.forecast;

const forecastResponse = await fetch(forecastUrl);
const forecastData = await forecastResponse.json();

// 3. Find forecast for target date
const targetDate = new Date(args.date);
const forecast = forecastData.properties.periods.find(p =>
  new Date(p.startTime).toDateString() === targetDate.toDateString()
);

// 4. Map to our condition categories
const condition = mapWeatherCondition(forecast.shortForecast);

return {
  date: args.date,
  city: args.city,
  condition,
  temperature_high: forecast.temperature,
  temperature_low: null,  // Would need night forecast
  precipitation_chance: forecast.probabilityOfPrecipitation?.value,
  summary: forecast.detailedForecast,
  source: 'weather.gov'
};

function mapWeatherCondition(shortForecast: string): string {
  const lower = shortForecast.toLowerCase();
  if (lower.includes('rain') || lower.includes('shower')) return 'rainy';
  if (lower.includes('sun') || lower.includes('clear')) return 'sunny';
  if (lower.includes('cloud') || lower.includes('overcast')) return 'cloudy';
  // Temperature-based (would need actual temp)
  return 'mild';
}
```

**Why Weather.gov:**
- FREE (no API key required)
- Excellent Bay Area coverage
- Reliable government service
- No rate limits for reasonable use
- 7-day forecasts

**Security:**
- Validate date format
- Whitelist city names
- Validate coordinate ranges (lat: 36-39, lon: -123 to -121)
- Handle API failures gracefully (return unknown)
- Timeout after 5 seconds

---

### Tool 3: calculate_drive_time

**Purpose:** Calculate drive time between two locations

**Signature:**
```typescript
interface CalculateDriveTimeArgs {
  from_location: string;  // 'home' | activity_id | city name
  to_location: string;    // activity_id | city name | coordinates
}

interface DriveTimeResult {
  drive_time_minutes: number;
  from: string;
  to: string;
  source: string;  // 'database' | 'estimated'
}
```

**v1 Implementation (Database Lookup):**
```typescript
// Home coordinates
const HOME_COORDS = { lat: 37.8324, lon: -122.2128 }; // Oakland Montclair

// If from_location === 'home' and to_location is activity_id:
// → Look up activity.drive_time_minutes from database
if (args.from_location === 'home') {
  const activity = await getActivityById(args.to_location);
  return {
    drive_time_minutes: activity.drive_time_minutes || 30,
    from: 'home',
    to: activity.name,
    source: 'database'
  };
}

// If both are activity IDs:
// → Look up both, calculate approximate time
// (Simple: Manhattan distance × 2 minutes per mile)

// If city names:
// → Use city center coordinates, estimate
const CITY_ESTIMATES = {
  'Oakland->Berkeley': 20,
  'Oakland->Walnut Creek': 35,
  'Berkeley->SF': 30,
  // ...
};

const key = `${args.from_location}->${args.to_location}`;
const estimate = CITY_ESTIMATES[key] || 30; // Default 30 min

return {
  drive_time_minutes: estimate,
  from: args.from_location,
  to: args.to_location,
  source: 'estimated'
};
```

**v2 Implementation (Future):**
- Google Maps Distance Matrix API
- Real-time traffic data
- Multiple route options

**Security:**
- Validate location strings (no SQL injection)
- UUID validation for activity IDs
- Whitelist city names

---

### Tool 4: suggest_timing

**Purpose:** Suggest optimal timing for an activity on a given date

**Signature:**
```typescript
interface SuggestTimingArgs {
  activity_id: string;
  date: string;  // YYYY-MM-DD
}

interface TimingSuggestionResult {
  suggested_start: string;  // HH:MM
  suggested_end: string;    // HH:MM
  reasoning: string[];
  weather: WeatherForecastResult;
  drive_time: number;
  opening_hours: OpeningHoursResult;
}
```

**Implementation:**
```typescript
async function suggestTiming(args: SuggestTimingArgs): Promise<string> {
  // 1. Get activity details
  const activity = await getActivityById(args.activity_id);

  // 2. Get weather forecast
  const weather = await getWeatherForecast({
    date: args.date,
    city: activity.city
  });

  // 3. Get opening hours (v1: stub)
  const hours = await checkOpeningHours({
    activity_id: args.activity_id,
    date: args.date
  });

  // 4. Get drive time from home
  const driveTime = await calculateDriveTime({
    from_location: 'home',
    to_location: args.activity_id
  });

  // 5. Suggest timing
  const reasoning: string[] = [];

  // Default: 10am start (good for young kids)
  let startHour = 10;
  let startMinute = 0;

  // Adjust for weather
  if (weather.condition === 'hot') {
    startHour = 9; // Earlier to avoid heat
    reasoning.push('Starting earlier to avoid afternoon heat');
  }
  if (weather.condition === 'rainy') {
    startHour = 11; // Wait for possible clearing
    reasoning.push('Starting later in case rain clears');
  }

  // Adjust for drive time
  if (driveTime.drive_time_minutes > 45) {
    startHour = 9; // Earlier to maximize time there
    reasoning.push('Starting earlier due to long drive');
  }

  // Typical activity duration: 2-3 hours
  const durationHours = 2.5;
  const endHour = startHour + Math.floor(durationHours);
  const endMinute = (durationHours % 1) * 60;

  // Account for nap times (removed - kids don't nap anymore per context)

  // Account for lunch
  if (startHour >= 11 && startHour < 13) {
    reasoning.push('Plan to eat lunch during or after activity');
  }

  const suggested = {
    suggested_start: `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`,
    suggested_end: `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`,
    reasoning,
    weather,
    drive_time: driveTime.drive_time_minutes,
    opening_hours: hours
  };

  return JSON.stringify(suggested, null, 2);
}
```

**Security:**
- UUID validation
- Date validation
- Handle API failures gracefully

---

### Security Checklist for Schedule Sync

- [ ] Date format validation (YYYY-MM-DD)
- [ ] Time format validation (HH:MM)
- [ ] UUID validation for activity_id
- [ ] City name whitelist
- [ ] Coordinate range validation
- [ ] Weather API timeout (5 seconds)
- [ ] Error sanitization
- [ ] Environment validation
- [ ] Handle external API failures gracefully

---

### Testing Checklist for Schedule Sync

**Build Tests:**
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes

**Unit Tests:**
- [ ] check_calendar_conflicts: Returns no conflicts (v1 stub)
- [ ] get_weather_forecast: Calls Weather.gov successfully
- [ ] get_weather_forecast: Maps conditions correctly
- [ ] get_weather_forecast: Handles API failures
- [ ] calculate_drive_time: Returns database drive_time for home→activity
- [ ] calculate_drive_time: Estimates for city→city
- [ ] suggest_timing: Combines all data sources
- [ ] suggest_timing: Adjusts for weather
- [ ] suggest_timing: Accounts for drive time

**Edge Cases:**
- [ ] Invalid date → error
- [ ] Unknown city → error
- [ ] Weather API down → graceful fallback
- [ ] Activity with no drive_time → default 30 min

---

## 📋 ORCHESTRATOR: Detailed Implementation Plan

### Overview
**Purpose:** Coordinate all subagents to generate weekend plans
**Priority:** HIGH
**Time:** 6 hours
**Dependencies:** Activity Planner ✅ + Schedule Sync ✅ + Food Finder ✅
**Parallelizable:** NO (must be sequential after other servers)

---

### Architecture Pattern

**Direct Tool Calling (Option B):**
```typescript
// Import tools from other servers
import {
  queryActivities,
  suggestActivityChain,
  getActivityDetails
} from '../activity-planner/src/exports.js';

import {
  matchRestaurantToActivity,
  findRestaurants,
  checkDietarySafety
} from '../food-finder/src/exports.js';

import {
  getWeatherForecast,
  suggestTiming,
  calculateDriveTime
} from '../schedule-sync/src/exports.js';

// Use in orchestration
const activities = await suggestActivityChain({ date, num_suggestions: 3 });
const restaurant = await matchRestaurantToActivity({ activity_id: activities[0].id });
const weather = await getWeatherForecast({ date, city: activities[0].city });
```

**Benefits:**
- Real-time (no database polling)
- Type-safe imports
- Clear dependency chain
- Easier debugging

---

### Tool 1: plan_weekend

**Purpose:** Main coordination function - generate 3 complete weekend suggestions

**Signature:**
```typescript
interface PlanWeekendArgs {
  date: string;              // Target date (YYYY-MM-DD)
  num_suggestions?: number;  // Default: 3
  preferences?: {
    weather_override?: string;
    max_drive_time?: number;
    cuisine_preference?: string;
    indoor_outdoor?: string;
  };
}

interface WeekendSuggestion {
  activity: ScoredActivity;
  restaurant: Restaurant;
  timing: TimingSuggestionResult;
  weather: WeatherForecastResult;
  total_drive_time: number;  // home → activity → restaurant → home
  summary: string;           // WhatsApp-friendly description
}

interface PlanWeekendResult {
  date: string;
  suggestions: WeekendSuggestion[];
  metadata: {
    generated_at: string;
    weather_considered: boolean;
    preferences_applied: string[];
  };
}
```

**Implementation:**
```typescript
async function planWeekend(args: PlanWeekendArgs): Promise<string> {
  const date = args.date;
  const numSuggestions = args.num_suggestions || 3;

  // 1. Get weather forecast (for default city: Oakland)
  const weather = await getWeatherForecast({
    date,
    city: 'Oakland'
  });

  // 2. Get activity suggestions
  const activityResult = await suggestActivityChain({
    date,
    num_suggestions: numSuggestions,
    weather_condition: args.preferences?.weather_override || weather.condition,
    attendees: ['3yo', '5yo']
  });

  const activities = JSON.parse(activityResult).suggestions;

  // 3. For each activity, find matching restaurant and timing
  const suggestions: WeekendSuggestion[] = [];

  for (const activity of activities) {
    // Get weather for activity's city (if different from Oakland)
    const activityWeather = activity.city !== 'Oakland'
      ? await getWeatherForecast({ date, city: activity.city })
      : weather;

    // Find restaurant near activity
    const restaurantResult = await matchRestaurantToActivity({
      activity_id: activity.id,
      max_results: 1,
      max_drive_time: 15 // Within 15 min of activity
    });

    const restaurants = JSON.parse(restaurantResult).matched_restaurants;
    const restaurant = restaurants[0]; // Take best match

    // Get timing suggestion
    const timingResult = await suggestTiming({
      activity_id: activity.id,
      date
    });

    const timing = JSON.parse(timingResult);

    // Calculate total drive time: home → activity → restaurant → home
    const homeToActivity = activity.drive_time_minutes || 30;
    const activityToRestaurant = restaurant?.drive_time_from_activity || 5;
    const restaurantToHome = restaurant?.drive_time_minutes || 30;
    const totalDriveTime = homeToActivity + activityToRestaurant + restaurantToHome;

    // Create WhatsApp-friendly summary
    const summary = formatSuggestionForWhatsApp(activity, restaurant, timing, activityWeather);

    suggestions.push({
      activity,
      restaurant,
      timing,
      weather: activityWeather,
      total_drive_time: totalDriveTime,
      summary
    });
  }

  const result: PlanWeekendResult = {
    date,
    suggestions,
    metadata: {
      generated_at: new Date().toISOString(),
      weather_considered: true,
      preferences_applied: args.preferences ? Object.keys(args.preferences) : []
    }
  };

  return JSON.stringify(result, null, 2);
}

function formatSuggestionForWhatsApp(
  activity: ScoredActivity,
  restaurant: Restaurant,
  timing: TimingSuggestionResult,
  weather: WeatherForecastResult
): string {
  return `
🎯 **${activity.name}** (${activity.city})
📍 ${activity.drive_time_minutes} min drive
⏰ ${timing.suggested_start} - ${timing.suggested_end}
🌤️ ${weather.condition} (${weather.temperature_high}°F)

🍽️ **After:** ${restaurant.name}
🥙 ${restaurant.cuisine} (${restaurant.drive_time_from_activity} min from activity)
✅ Celiac-safe, allergen-free

💡 **Why:** Score ${activity.score.toFixed(2)} - ${activity.score_breakdown.rating_component > 0.3 ? 'Highly rated' : 'Good novelty'}, ${activity.score_breakdown.drive_time_component > 0.8 ? 'close by' : 'worth the drive'}
  `.trim();
}
```

**Error Handling:**
```typescript
try {
  const activities = await suggestActivityChain(args);
} catch (error) {
  // Log full error
  console.error('Activity Planner failed:', error);

  // Return sanitized error to user
  throw new Error('Unable to generate activity suggestions. Please try again.');
}
```

**Security:**
- Validate all args before calling subagents
- Sanitize subagent responses before returning
- Handle subagent failures gracefully
- Never expose internal errors to user

---

### Tool 2: get_day_plan

**Purpose:** Detailed plan for a single selected activity

**Signature:**
```typescript
interface GetDayPlanArgs {
  activity_id: string;
  date: string;
  include_alternatives?: boolean;  // Include backup activities if weather bad
}

interface DayPlan {
  main_activity: {
    details: Activity;
    visit_history: Visit[];
    timing: TimingSuggestionResult;
    weather: WeatherForecastResult;
    driving_directions: string;
  };
  restaurant: {
    details: Restaurant;
    dietary_safety: DietarySafetyResult;
    drive_from_activity: number;
  };
  alternatives?: ScoredActivity[];  // If weather bad
  total_timeline: TimelineEntry[];
}

interface TimelineEntry {
  time: string;  // HH:MM
  activity: string;
  duration_minutes: number;
  notes: string;
}
```

**Implementation:**
```typescript
async function getDayPlan(args: GetDayPlanArgs): Promise<string> {
  // 1. Get full activity details
  const activityDetails = JSON.parse(
    await getActivityDetails({ activity_id: args.activity_id })
  );

  // 2. Get timing
  const timing = JSON.parse(
    await suggestTiming({ activity_id: args.activity_id, date: args.date })
  );

  // 3. Get weather
  const weather = timing.weather;

  // 4. Get matched restaurant
  const restaurantMatch = JSON.parse(
    await matchRestaurantToActivity({
      activity_id: args.activity_id,
      max_results: 3  // Get top 3 options
    })
  );

  const restaurant = restaurantMatch.matched_restaurants[0];

  // 5. Check dietary safety explicitly
  const dietarySafety = JSON.parse(
    await checkDietarySafety({ restaurant_id: restaurant.id })
  );

  // 6. If weather bad and alternatives requested, get backups
  let alternatives = [];
  if (args.include_alternatives && (weather.condition === 'rainy' || weather.condition === 'cold')) {
    const altSuggestions = JSON.parse(
      await suggestActivityChain({
        date: args.date,
        num_suggestions: 2,
        weather_condition: weather.condition,
        attendees: ['3yo', '5yo']
      })
    );
    alternatives = altSuggestions.suggestions.filter(a => a.id !== args.activity_id);
  }

  // 7. Build timeline
  const timeline = buildTimeline(activityDetails, restaurant, timing);

  // 8. Format plan
  const plan: DayPlan = {
    main_activity: {
      details: activityDetails,
      visit_history: activityDetails.visit_history,
      timing,
      weather,
      driving_directions: `From home to ${activityDetails.name}: ${activityDetails.drive_time_minutes} min via Google Maps`
    },
    restaurant: {
      details: restaurant,
      dietary_safety: dietarySafety,
      drive_from_activity: restaurant.drive_time_from_activity
    },
    alternatives: args.include_alternatives ? alternatives : undefined,
    total_timeline: timeline
  };

  return JSON.stringify(plan, null, 2);
}

function buildTimeline(activity, restaurant, timing): TimelineEntry[] {
  const entries: TimelineEntry[] = [];

  // Parse start time
  const [startHour, startMinute] = timing.suggested_start.split(':').map(Number);

  // Home departure (30 min before activity)
  const driveMins = activity.drive_time_minutes || 30;
  const departHour = startHour - Math.floor(driveMins / 60);
  const departMinute = startMinute - (driveMins % 60);

  entries.push({
    time: `${String(departHour).padStart(2, '0')}:${String(departMinute).padStart(2, '0')}`,
    activity: 'Leave home',
    duration_minutes: driveMins,
    notes: `Drive to ${activity.city}`
  });

  entries.push({
    time: timing.suggested_start,
    activity: `Arrive at ${activity.name}`,
    duration_minutes: 150, // 2.5 hours typical
    notes: activity.description
  });

  entries.push({
    time: timing.suggested_end,
    activity: `Drive to ${restaurant.name}`,
    duration_minutes: restaurant.drive_time_from_activity,
    notes: `${restaurant.cuisine} restaurant`
  });

  // ... continue timeline

  return entries;
}
```

**Security:**
- UUID validation
- Date validation
- Handle missing data gracefully

---

### Tool 3: answer_question

**Purpose:** Route follow-up questions to appropriate subagent

**Signature:**
```typescript
interface AnswerQuestionArgs {
  question: string;
  context?: {
    last_plan?: PlanWeekendResult;
    last_activity_id?: string;
  };
}

interface AnswerResult {
  answer: string;
  source: string;  // Which subagent answered
  confidence: 'high' | 'medium' | 'low';
}
```

**Implementation:**
```typescript
async function answerQuestion(args: AnswerQuestionArgs): Promise<string> {
  const question = args.question.toLowerCase();

  // Route to appropriate subagent based on question keywords

  // Restaurant questions
  if (question.includes('restaurant') || question.includes('food') || question.includes('eat')) {
    if (question.includes('safe') || question.includes('allergen') || question.includes('gluten')) {
      // Dietary safety question
      const restaurantId = extractRestaurantId(args.context);
      if (restaurantId) {
        const result = await checkDietarySafety({ restaurant_id: restaurantId });
        return JSON.stringify({
          answer: result,
          source: 'Food Finder',
          confidence: 'high'
        });
      }
    }

    // General restaurant search
    const cuisine = extractCuisine(question); // e.g., "mexican"
    const result = await findRestaurants({
      cuisine,
      limit: 5
    });
    return JSON.stringify({
      answer: result,
      source: 'Food Finder',
      confidence: 'high'
    });
  }

  // Activity questions
  if (question.includes('activity') || question.includes('place') || question.includes('do')) {
    if (question.includes('indoor') || question.includes('outdoor')) {
      const type = question.includes('indoor') ? 'indoor' : 'outdoor';
      const result = await queryActivities({
        indoor_outdoor: type,
        limit: 5
      });
      return JSON.stringify({
        answer: result,
        source: 'Activity Planner',
        confidence: 'high'
      });
    }

    // General activity query
    const result = await suggestActivityChain({
      date: args.context?.last_plan?.date || getTomorrow(),
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
  if (question.includes('when') || question.includes('time') || question.includes('open')) {
    const activityId = extractActivityId(args.context);
    if (activityId) {
      const date = extractDate(question) || getTomorrow();
      const result = await suggestTiming({ activity_id: activityId, date });
      return JSON.stringify({
        answer: result,
        source: 'Schedule Sync',
        confidence: 'high'
      });
    }
  }

  // Fallback: Can't route
  return JSON.stringify({
    answer: "I'm not sure how to answer that. Can you rephrase? I can help with activities, restaurants, weather, and timing.",
    source: 'Orchestrator',
    confidence: 'low'
  });
}

function extractRestaurantId(context): string | null {
  return context?.last_plan?.suggestions?.[0]?.restaurant?.id || null;
}

function extractActivityId(context): string | null {
  return context?.last_activity_id || context?.last_plan?.suggestions?.[0]?.activity?.id || null;
}

function extractCuisine(question: string): string | null {
  const cuisines = ['mexican', 'italian', 'chinese', 'japanese', 'thai', 'indian'];
  return cuisines.find(c => question.includes(c)) || null;
}

function extractCity(question: string): string | null {
  const cities = ['Oakland', 'Berkeley', 'Walnut Creek', 'SF', 'San Francisco'];
  return cities.find(c => question.toLowerCase().includes(c.toLowerCase())) || null;
}

function extractDate(question: string): string | null {
  // Simple: look for "tomorrow", "saturday", etc.
  // Advanced: NLP date parsing
  if (question.includes('tomorrow')) return getTomorrow();
  if (question.includes('saturday')) return getNextSaturday();
  return null;
}

function getTomorrow(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}
```

**Security:**
- Sanitize all extracted values
- Validate before passing to subagents
- Handle extraction failures gracefully
- Never expose raw question parsing logic

---

### Security Checklist for Orchestrator

- [ ] Validate ALL args before calling subagents
- [ ] Sanitize ALL subagent responses before returning
- [ ] Error handling for EVERY subagent call
- [ ] Never expose internal errors to user
- [ ] Question parsing: sanitize extracted values
- [ ] Rate limiting considerations (prevent abuse)
- [ ] Timeout handling (what if subagent hangs?)

---

### Testing Checklist for Orchestrator

**Build Tests:**
- [ ] All imports work (verify exports from other servers)
- [ ] `npm run build` succeeds
- [ ] `npx tsc --noEmit` passes

**Integration Tests:**
- [ ] plan_weekend: Returns 3 suggestions with all fields
- [ ] plan_weekend: Each suggestion has activity + restaurant + timing
- [ ] plan_weekend: Weather is fetched and used
- [ ] plan_weekend: Handles subagent failures
- [ ] get_day_plan: Returns complete timeline
- [ ] get_day_plan: Includes dietary safety check
- [ ] get_day_plan: Alternatives provided when weather bad
- [ ] answer_question: Routes restaurant questions correctly
- [ ] answer_question: Routes activity questions correctly
- [ ] answer_question: Routes weather questions correctly
- [ ] answer_question: Fallback works for unknown questions

**End-to-End Test:**
```bash
# Test via Claude Code CLI:
"Plan Saturday for both kids"

Expected:
- 3 suggestions returned
- Each has activity (scored), restaurant (dietary-safe), timing, weather
- Total drive times calculated
- WhatsApp-friendly summaries
```

---

## 🚀 Execution Plan: Putting It All Together

### Pre-Flight Checklist

Before starting implementation:

**Environment:**
- [ ] .env has SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
- [ ] Food Finder builds successfully (reference template)
- [ ] Database has 75 activities, 25 restaurants, 23 visits

**Tools:**
- [ ] Node.js installed
- [ ] TypeScript installed globally (`npm install -g typescript`)
- [ ] Claude Code CLI ready
- [ ] Text editor ready

**Documentation:**
- [ ] Food Finder session log read (`building/session-logs/2025-10-14-food-finder-implementation.md`)
- [ ] DECISIONS.md reviewed
- [ ] This meta-plan read completely

---

### Phase 1: Parallel Build (6 hours wall clock → with 2 subagents)

#### Subagent A: Activity Planner

**Estimated Time:** 4 hours

**Steps:**
1. **Setup** (30 min)
   - Copy Food Finder structure
   - Update package.json name
   - Install dependencies
   - Create src/index.ts skeleton

2. **Type Definitions** (30 min)
   - Activity interface (18 fields)
   - QueryActivitiesArgs
   - SuggestActivityChainArgs
   - ScoredActivity
   - Tool result types

3. **Security Utilities** (30 min)
   - UUID validation (copy from Food Finder)
   - City whitelist
   - Indoor/outdoor whitelist
   - Weather whitelist
   - Attendees whitelist
   - Error sanitization
   - Environment validation

4. **Tool 1: query_activities** (45 min)
   - Implement filtering logic
   - Build Supabase query
   - Sort and limit
   - Test build

5. **Tool 2: suggest_activity_chain** (90 min) **MOST COMPLEX**
   - Implement scoring algorithm
   - Query visits for novelty score
   - Calculate all 5 components
   - Sort by score
   - Return score breakdown
   - Test build

6. **Tool 3: get_activity_details** (30 min)
   - Query activity by ID
   - Query visit history
   - Aggregate data
   - Test build

7. **Tool 4: check_opening_hours** (15 min)
   - v1 stub (always return unknown)
   - Test build

8. **Final Steps** (30 min)
   - Create exports.ts
   - Create README.md
   - Final build test
   - Verify no TypeScript errors

**Deliverable:** Activity Planner builds successfully, all 4 tools implemented

---

#### Subagent B: Schedule Sync

**Estimated Time:** 3 hours

**Steps:**
1. **Setup** (20 min)
   - Copy Food Finder structure
   - Update package.json
   - Install dependencies
   - Create src/index.ts skeleton

2. **Type Definitions** (20 min)
   - WeatherForecastResult
   - CalendarConflictResult
   - DriveTimeResult
   - TimingSuggestionResult
   - Tool arg types

3. **Security Utilities** (20 min)
   - Date format validation
   - Time format validation
   - UUID validation
   - City whitelist
   - Coordinate validation
   - Error sanitization
   - Environment validation

4. **Tool 1: check_calendar_conflicts** (15 min)
   - v1 stub (always return no conflicts)
   - Test build

5. **Tool 2: get_weather_forecast** (60 min) **MOST COMPLEX**
   - City coordinates map
   - Weather.gov API call
   - Points endpoint
   - Forecast endpoint
   - Condition mapping
   - Error handling (timeout, API down)
   - Test build
   - **Test with real API call**

6. **Tool 3: calculate_drive_time** (30 min)
   - Database lookup for home→activity
   - City→city estimates
   - Test build

7. **Tool 4: suggest_timing** (45 min)
   - Call other tools (weather, drive time, hours)
   - Apply timing logic
   - Build reasoning
   - Format result
   - Test build

8. **Final Steps** (20 min)
   - Create exports.ts
   - Create README.md
   - Final build test
   - Test Weather API integration

**Deliverable:** Schedule Sync builds successfully, Weather API works

---

### Phase 2: Sequential Build (6 hours)

#### Orchestrator

**Estimated Time:** 6 hours

**Prerequisites:**
- Activity Planner ✅ built
- Schedule Sync ✅ built
- Food Finder ✅ built (already done)

**Steps:**
1. **Setup** (30 min)
   - Orchestrator skeleton already exists
   - Install dependencies
   - Import tools from other 3 servers
   - Verify imports work
   - Test build with imports

2. **Type Definitions** (30 min)
   - PlanWeekendArgs
   - WeekendSuggestion
   - PlanWeekendResult
   - GetDayPlanArgs
   - DayPlan
   - TimelineEntry
   - AnswerQuestionArgs
   - AnswerResult

3. **Tool 1: plan_weekend** (180 min) **MOST COMPLEX**
   - Call Activity Planner.suggestActivityChain
   - Loop through suggestions
   - For each: call Food Finder.matchRestaurantToActivity
   - For each: call Schedule Sync.getWeatherForecast
   - For each: call Schedule Sync.suggestTiming
   - Calculate total drive times
   - Format WhatsApp summaries
   - Error handling for EACH subagent call
   - Test build
   - **Test end-to-end via CLI**

4. **Tool 2: get_day_plan** (90 min)
   - Call Activity Planner.getActivityDetails
   - Call Food Finder.matchRestaurantToActivity
   - Call Food Finder.checkDietarySafety
   - Call Schedule Sync.suggestTiming
   - Build timeline
   - Handle alternatives (if weather bad)
   - Test build
   - **Test via CLI**

5. **Tool 3: answer_question** (60 min)
   - Implement routing logic
   - Extract keywords (restaurant, activity, weather, timing)
   - Extract entities (city, cuisine, date)
   - Route to correct subagent
   - Handle fallback
   - Test build
   - **Test with various questions**

6. **Final Steps** (60 min)
   - Create README.md
   - Update .mcp.json
   - Final build all 3 servers
   - End-to-end test: "plan saturday"
   - Verify full workflow

**Deliverable:** Orchestrator coordinates all subagents, generates complete weekend plans

---

### Phase 3: Integration Testing (2 hours)

**Test Suite:**

1. **Individual Server Tests** (30 min)
   - Activity Planner: query_activities, suggest_activity_chain
   - Schedule Sync: get_weather_forecast, suggest_timing
   - Orchestrator: plan_weekend

2. **Cross-Server Tests** (45 min)
   - plan_weekend → calls all 3 subagents
   - get_day_plan → full timeline generation
   - answer_question → routing to correct subagent

3. **Edge Cases** (30 min)
   - Invalid UUIDs
   - Weather API down (should gracefully degrade)
   - No activities match filters
   - No restaurants near activity

4. **Error Handling** (15 min)
   - Subagent failures
   - Missing data
   - Invalid inputs

**Success Criteria:**
- All builds pass
- End-to-end test: "plan saturday for both kids" returns 3 complete suggestions
- All error cases handled gracefully
- No TypeScript errors
- All security measures verified

---

## 📝 Session Log Template

Use this template when creating the session log after implementation:

```markdown
# Session Log: 3 MCP Servers Implementation

**Date:** YYYY-MM-DD
**Duration:** X hours
**Status:** ✅ COMPLETE / 🟡 IN PROGRESS / ❌ BLOCKED

---

## Summary

[Brief overview of what was accomplished]

---

## Accomplishments

### Activity Planner
- [x] Tool 1: query_activities
- [x] Tool 2: suggest_activity_chain
- [x] Tool 3: get_activity_details
- [x] Tool 4: check_opening_hours
- [x] Build passes
- [x] Exports created

### Schedule Sync
- [x] Tool 1: check_calendar_conflicts
- [x] Tool 2: get_weather_forecast
- [x] Tool 3: calculate_drive_time
- [x] Tool 4: suggest_timing
- [x] Weather API integration working
- [x] Build passes
- [x] Exports created

### Orchestrator
- [x] Tool 1: plan_weekend
- [x] Tool 2: get_day_plan
- [x] Tool 3: answer_question
- [x] Imports from all 3 servers working
- [x] Build passes
- [x] End-to-end test passes

---

## Issues Encountered

### Issue 1: [Title]
**Problem:** [Description]
**Solution:** [How resolved]
**Prevention:** [How to avoid]

[Repeat for each issue]

---

## Testing Results

**Build Tests:**
- Activity Planner: ✅ PASS
- Schedule Sync: ✅ PASS
- Orchestrator: ✅ PASS

**Integration Tests:**
- plan_weekend: ✅ PASS
- get_day_plan: ✅ PASS
- answer_question: ✅ PASS

**End-to-End:**
- "plan saturday": ✅ Returns 3 suggestions
- Weather API: ✅ Returns forecast
- Dietary safety: ✅ All restaurants safe

---

## Lessons Learned

1. [Key insight from Activity Planner]
2. [Key insight from Schedule Sync]
3. [Key insight from Orchestrator]
4. [What would you do differently?]

---

## Next Steps

1. n8n workflow integration
2. WhatsApp bot setup
3. Prompt tuning for better suggestions

---

**Session End:** [Timestamp]
```

---

## 🎯 Success Criteria

### Activity Planner ✅
- [ ] Builds without TypeScript errors
- [ ] All 4 tools implemented
- [ ] Scoring algorithm uses visit data
- [ ] UUID validation on all inputs
- [ ] Returns scored suggestions

### Schedule Sync ✅
- [ ] Builds without TypeScript errors
- [ ] All 4 tools implemented
- [ ] Weather.gov API integration works
- [ ] Handles API failures gracefully
- [ ] Returns timing with reasoning

### Orchestrator ✅
- [ ] Builds without TypeScript errors
- [ ] All 3 tools implemented
- [ ] Imports from all 3 servers work
- [ ] plan_weekend returns 3 complete suggestions
- [ ] Error handling for all subagent calls

### End-to-End ✅
- [ ] CLI test: "plan saturday" works
- [ ] Each suggestion has: activity, restaurant, timing, weather
- [ ] All restaurants are dietary-safe
- [ ] Drive times calculated correctly
- [ ] WhatsApp-friendly formatting

---

## 📚 Reference Files

**Copy these patterns from Food Finder:**
- `mcp-servers/food-finder/package.json` - Dependencies, scripts, ES modules
- `mcp-servers/food-finder/tsconfig.json` - TypeScript configuration
- `mcp-servers/food-finder/src/index.ts` - Security utilities, error handling
- `mcp-servers/food-finder/src/exports.ts` - Clean API exports
- `mcp-servers/food-finder/.gitignore` - Standard gitignore

**Read for context:**
- `building/session-logs/2025-10-14-food-finder-implementation.md` - Full implementation log
- `building/DECISIONS.md` - All architectural decisions
- `building/STRATEGIC-PLAN.md` - Overall project strategy

**Update after completion:**
- `building/PROGRESS.md` - Mark Phase 2 as 100% complete
- `building/ISSUES.md` - Add any new issues encountered
- `building/DECISIONS.md` - Add any new architectural decisions
- `NEXT-STEPS.md` - Update next action to n8n workflows

---

## 🚦 Start Command

When ready to execute this plan:

```bash
# 1. Navigate to project root
cd /Users/dshein/Personal\ Projects/projects/weekend-activity-planner

# 2. Verify Food Finder builds (reference template)
cd mcp-servers/food-finder && npm run build && cd ../..

# 3. Check database has data
# (via Supabase dashboard or Claude Code MCP)

# 4. Start implementation with parallel subagents:
# → Subagent A: Activity Planner (4 hours)
# → Subagent B: Schedule Sync (3 hours)
# → Then Sequential: Orchestrator (6 hours)
```

---

**Meta-Plan Complete.** Ready for autonomous execution with `/start` command.

**Time to completion:** ~13 hours sequential, ~8 hours with parallelization

**Next after completion:** n8n workflow integration (Phase 3)

---

*This meta-plan distills Food Finder learnings into a clear, autonomous execution strategy. All 3 servers follow proven patterns. Parallel execution maximizes efficiency. Success criteria are concrete. Ready to build.* 🚀
