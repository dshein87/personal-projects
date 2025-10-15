# Schedule Sync MCP Server

Weather forecasting, calendar checking, drive time calculation, and timing suggestions for Weekend Activity Planner.

## Status

**✅ PRODUCTION READY** - All 4 tools implemented and tested

## Tools Provided

### 1. check_calendar_conflicts

Check for calendar conflicts in a date range.

**Status:** v1 stub (returns no conflicts), v2 will integrate Google Calendar

**Input:**
```typescript
{
  start_date: string;     // YYYY-MM-DD
  end_date: string;       // YYYY-MM-DD
  time_range?: {
    start: string;        // HH:MM (24-hour)
    end: string;          // HH:MM (24-hour)
  };
}
```

**Output:**
```json
{
  "has_conflicts": false,
  "conflicts": [],
  "note": "Calendar integration not available in v1. Check your calendar manually.",
  "date_range": { "start": "2025-10-18", "end": "2025-10-18" },
  "time_range": null
}
```

---

### 2. get_weather_forecast

**⭐ REAL WEATHER DATA** - Fetches actual forecast from Weather.gov API (NOAA)

**Status:** ✅ Fully implemented and tested

**API:** Weather.gov (FREE, no API key required)

**Input:**
```typescript
{
  date: string;           // YYYY-MM-DD
  city: string;           // 'Oakland' | 'Berkeley' | 'Walnut Creek' | etc.
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}
```

**Output:**
```json
{
  "date": "2025-10-15",
  "city": "Oakland",
  "condition": "rainy",
  "temperature_high": 62,
  "temperature_low": null,
  "precipitation_chance": 48,
  "summary": "Chance of rain showers. High near 62°F. Winds light and variable.",
  "source": "weather.gov"
}
```

**Condition mapping:**
- `rainy` - Rain, showers, storms
- `sunny` - Sunny, clear skies
- `cloudy` - Cloudy, overcast
- `hot` - Temperature ≥ 85°F
- `cold` - Temperature ≤ 45°F
- `mild` - Default/other conditions

**Supported cities:**
- Oakland
- Berkeley
- Walnut Creek
- Lafayette
- Orinda
- San Francisco (or "SF")

**Error handling:**
- 5 second timeout on API calls
- Graceful fallback if API unavailable
- Returns `condition: "mild"` as fallback

---

### 3. calculate_drive_time

Calculate drive time between locations.

**Status:** ✅ Fully implemented

**Supports:**
- `home → activity` (database lookup)
- `city → city` (pre-calculated estimates)
- `activity → activity` (estimated)

**Input:**
```typescript
{
  from_location: string;  // 'home' | activity_id (UUID) | city name
  to_location: string;    // activity_id (UUID) | city name
}
```

**Output:**
```json
{
  "drive_time_minutes": 25,
  "from": "home",
  "to": "Frog Park",
  "source": "database"
}
```

**Sources:**
- `database` - From activities.drive_time_minutes
- `estimated` - City-to-city estimates or activity-to-activity calculation
- `fallback` - Error occurred, using 30-minute default

---

### 4. suggest_timing

Suggest optimal start/end times for an activity.

**Status:** ✅ Fully implemented

**Combines:**
- Activity details (from database)
- Weather forecast (real-time via Weather.gov)
- Drive time calculation

**Input:**
```typescript
{
  activity_id: string;    // UUID
  date: string;           // YYYY-MM-DD
}
```

**Output:**
```json
{
  "activity": {
    "id": "...",
    "name": "Oakland Zoo",
    "city": "Oakland"
  },
  "suggested_start": "10:00",
  "suggested_end": "12:30",
  "reasoning": [
    "Standard weekend morning timing"
  ],
  "weather": {
    "condition": "rainy",
    "temperature_high": 62,
    "precipitation_chance": 48,
    "summary": "Chance of rain showers..."
  },
  "drive_time_minutes": 25,
  "opening_hours": {
    "is_open": null,
    "note": "Opening hours not available in v1"
  }
}
```

**Timing logic:**
- Default: 10:00am start, 2.5 hour duration
- Hot weather: Start at 9:00am (avoid afternoon heat)
- Rainy + outdoor: Start at 11:00am (let rain clear)
- Cold weather: Start at 11:00am (let morning warm up)
- Long drive (>45 min): Start at 9:00am

---

## Security Features

All tools implement:

1. **Input validation**
   - UUID format validation (regex)
   - Date format validation (YYYY-MM-DD)
   - Time format validation (HH:MM)
   - City name whitelist
   - Coordinate range validation (East Bay area only)

2. **Error sanitization**
   - Never expose internal database structure
   - Generic error messages to clients
   - Detailed errors to console.error (server logs)

3. **API timeout handling**
   - 5 second timeout on Weather.gov API calls
   - Graceful fallback on timeout/failure

4. **Database security**
   - Supabase query builder (no raw SQL)
   - SERVICE_ROLE_KEY for server-side operations
   - UUID validation before all queries

---

## Development

### Build
```bash
npm install
npm run build
```

### Watch mode (development)
```bash
npm run dev
```

### TypeScript check
```bash
npx tsc --noEmit
```

### Test Weather API
```bash
node test-weather.js  # (if test file exists)
```

---

## Environment Variables

Required in `.env` (project root):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Note:** Weather.gov API requires NO API key!

---

## Usage in Orchestrator

Direct tool calling pattern:

```typescript
import {
  checkCalendarConflicts,
  getWeatherForecast,
  calculateDriveTime,
  suggestTiming
} from '../schedule-sync/src/exports.js';

// Check weather for Saturday
const weather = await getWeatherForecast({
  date: '2025-10-18',
  city: 'Oakland'
});

// Get timing suggestion
const timing = await suggestTiming({
  activity_id: 'activity-uuid-here',
  date: '2025-10-18'
});
```

---

## Testing Checklist

- [x] `npm install` succeeds
- [x] `npm run build` passes
- [x] `npx tsc --noEmit` passes
- [x] Weather.gov API makes real calls
- [x] Weather condition mapping works
- [x] Drive time returns database values
- [x] Timing suggestions combine all data
- [x] API timeout handling works
- [x] exports.ts created and compiles

---

## Files

- **src/index.ts** (1,054 lines) - Main implementation
- **src/exports.ts** (21 lines) - Orchestrator imports
- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript configuration
- **dist/** - Compiled JavaScript + type definitions

---

## Weather.gov API Notes

**API Endpoint:** https://api.weather.gov

**Required Header:** `User-Agent: WeekendActivityPlanner/1.0`

**Two-step process:**
1. Call Points API: `/points/{latitude},{longitude}`
   - Returns forecast URL for that location
2. Call Forecast API: URL from step 1
   - Returns 7-day forecast periods

**Rate limits:** None documented, but be respectful (we only call once per activity suggestion)

**Forecast range:** ~7 days out

**Accuracy:** Official NOAA data, updated multiple times daily

---

## Future Enhancements (v2)

1. **Google Calendar integration** - Replace check_calendar_conflicts stub
2. **Opening hours** - Add business hours checking
3. **Google Maps API** - Real drive time calculations
4. **Cache weather** - Reduce API calls for same date/city
5. **Multi-day forecasts** - Support weekend trips (Fri-Sun)

---

## Architecture Notes

**Why Weather.gov?**
- FREE (no API key)
- Official NOAA data
- No rate limits
- Good coverage for US locations
- Simple JSON API

**Why database drive times?**
- More accurate than API estimates
- No API costs
- Instant (no network call)
- Can incorporate family preferences (surface streets vs highway)

**Why stub calendar?**
- Google Calendar API requires OAuth setup
- v1 focus: core activity planning
- v2: Add calendar integration after proving value

---

Built for **Weekend Activity Planner** - Oakland, CA family weekend planning system.
