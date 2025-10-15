# Strategic Plan - Weekend Activity Planner
**Living Document** - Updated throughout project lifecycle
**Last Major Update:** 2025-10-14 (Comprehensive strategic assessment)
**Status:** Phase 1 - ~80% Complete
**Permanent Location:** building/STRATEGIC-PLAN.md

---

## Executive Summary

The Weekend Activity Planner has a **solid foundation** in place with a fully functional database, seed data, and clear architecture. The project is well-documented and ready to move into implementation phase.

**Current Reality:**
- ✅ Database: 100% complete (Supabase with 75 activities, 25 restaurants, working MCP integration)
- ✅ Documentation: Exceptional (11 building/ docs, comprehensive guides)
- ✅ Architecture: Well-designed (multi-agent with direct tool calling)
- ⚠️ Rating Data: 0% (CRITICAL BLOCKER for AI recommendations)
- ⚠️ MCP Servers: 5% (only skeleton structure exists)
- ⚠️ Automation: 0% (n8n workflows not started)

**Key Insight:** We have excellent planning but minimal execution. The project needs to shift from "planning mode" to "building mode."

---

## Part 1: Current State Assessment

### What's Actually Working ✅

1. **Database Infrastructure (100%)**
   - Supabase project live and operational
   - All 10 tables created with proper schema
   - 75 Oakland/East Bay activities seeded
   - 25 celiac-safe restaurants seeded
   - 5 concert venues seeded
   - Supabase MCP server connected and tested (read-only mode)
   - **Proof:** Just successfully queried database via MCP tools

2. **Documentation System (100%)**
   - Complete building/ directory with 11 comprehensive guides
   - Session logs tracking all work
   - Clear implementation guides
   - API references
   - Testing strategies documented
   - **Quality:** Among the best-documented personal projects I've seen

3. **Project Infrastructure (100%)**
   - Proper .gitignore (no secrets will leak)
   - .env.example template with all 16 required API keys
   - .claude/CLAUDE.md with full project context
   - .mcp.json configured for Supabase access
   - Security-first approach throughout

4. **Rating UI (100% built, 0% used)**
   - Streamlit app fully implemented
   - Connects to Supabase successfully
   - Proper UX for rating 3yo vs 5yo separately
   - Auto-advance to next unrated activity
   - Push to Supabase functionality
   - **Problem:** Never actually been run to collect ratings

### What's NOT Working ❌

1. **Rating Data (CRITICAL BLOCKER)**
   - **Status:** visits table is EMPTY (0 records)
   - **Impact:** Recommendation algorithms have nothing to learn from
   - **Why This Matters:** Without ratings, Activity Planner can't score activities
   - **Time to Fix:** 30-45 minutes of focused rating work
   - **Priority:** **HIGHEST - Must do FIRST**

2. **MCP Server Implementations**
   - **Orchestrator:** Has skeleton (package.json, tsconfig, index.ts), but ALL functions return TODO messages
   - **Activity Planner:** Empty directory
   - **Food Finder:** Empty directory
   - **Music Scout:** Empty directory
   - **Schedule Sync:** Empty directory
   - **Reality:** 0 functional MCP tools beyond the database skeleton

3. **API Integrations**
   - Spotify: Not set up
   - Google Calendar: Not set up
   - WhatsApp: Not set up
   - Weather API: Not set up
   - Concert APIs: Not set up
   - **Impact:** Can't build automation without these

4. **n8n Workflows**
   - **Status:** Not started
   - **Missing:** All 6 workflows (weekly suggestions, Spotify sync, concert discovery, etc.)

### Honest Progress Assessment

**Phase 1 Foundation:** ~80% complete (not 70% as previously documented)
- ✅ Project structure: 100%
- ✅ Documentation: 100%
- ✅ Database: 100%
- ✅ Rating UI code: 100%
- ❌ Bootstrap ratings: 0%
- ❌ MCP implementations: 5%

**Phase 2 MCP Servers:** 0% (not started)

**Phase 3 Automation:** 0% (blocked by Phase 2)

**Overall Project:** ~25% complete toward v1 launch

---

## Part 2: Critical Path Forward

### The One Thing That Must Happen Next

**Bootstrap the rating data.** Period.

Everything else depends on this. Here's why:

```python
# Activity Planner scoring algorithm (from IMPLEMENTATION-GUIDE.md)
score = (
  rating_weight * avg_rating +           # ❌ BLOCKED: No ratings exist
  novelty_weight * (1 - visit_frequency) # ❌ BLOCKED: No visit history
  drive_time_penalty * exp(-drive_time/30) +
  age_match_bonus +
  weather_match_bonus
)
```

**Without ratings:**
- Activity Planner returns random results
- Can't learn preferences
- Can't identify favorites
- No "rotation standbys" logic
- No "you haven't been to X in 3 weeks" suggestions

### Immediate Next Steps (Ordered by Dependency)

#### Step 1: Bootstrap Ratings (DAY 1 - 45 minutes) ⭐ START HERE

**Task:** Rate 30-40 activities you've actually visited

**Commands:**
```bash
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner/rating-ui"
source ../.venv/bin/activate  # If venv exists
pip install -r requirements.txt
streamlit run streamlit_app.py
```

**Focus on these favorites (from your memory):**
- Frog Park (biking, playground, farmers market)
- Heather Farms Park (post-swim lessons)
- Draquena Quarry Park
- Adventure Playground Berkeley (messy creative play)
- Oakland Zoo
- Fairyland
- Cereal Cinema (rainy day)
- Tilden Little Farm
- Lawrence Hall of Science
- Chabot Space & Science Center

**Rating Strategy:**
1. **Be honest:** Rate what 3yo and 5yo ACTUALLY enjoyed, not what they "should" enjoy
2. **Separate ratings:** 3yo and 5yo have different preferences - use different scores
3. **Add notes:** "3yo loved the goats, 5yo was bored after 30min" - this helps the AI
4. **Last visited:** Approximate date is fine
5. **Would return:** Be real about this

**Validation:**
After rating, verify in Supabase:
```sql
SELECT COUNT(*) FROM visits;  -- Should be > 0
SELECT * FROM visits LIMIT 5;  -- Spot check data
```

**Success Criteria:** ≥30 activities rated with separate 3yo/5yo scores

---

#### Step 2: Implement Food Finder MCP Server (DAY 2-3 - 3 hours)

**Why this one first?**
- Simplest server (straightforward database queries)
- No complex API integrations
- Immediate value (dietary-safe restaurant suggestions)
- Creates template for other servers

**Implementation Guide:**

```bash
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner/mcp-servers/food-finder"
npm init -y
npm install @modelcontextprotocol/sdk @supabase/supabase-js dotenv zod
mkdir src
```

**Create `src/index.ts`:**

Tools to implement (in order):
1. **find_restaurants** - Query restaurants with dietary filtering
   ```typescript
   // CRITICAL: Always filter by dietary restrictions
   WHERE celiac_safe = true
     AND sesame_free_options = true
     AND cashew_free_options = true
     AND flax_free_options = true
   ```

2. **check_dietary_safety** - Verify restaurant is safe for specific allergies

3. **match_restaurant_to_activity** - Find restaurants near an activity

4. **get_restaurant_details** - Full restaurant info

**Testing:**
```bash
npm run build
# Then test via Claude Code CLI or MCP inspector
```

**Success Criteria:**
- All 4 tools return valid JSON
- Dietary filtering works correctly (never suggests unsafe restaurants)
- Can query by city, drive time, cuisine
- Returns top 5 matches sorted by rating

**Time Estimate:** 3 hours

---

#### Step 3: Implement Activity Planner MCP Server (DAY 3-4 - 4 hours)

**Why second?**
- Most important server for core functionality
- Now has rating data to work with (from Step 1)
- Follows same pattern as Food Finder

**Implementation Guide:**

Tools to implement:
1. **query_activities** - Filter activities by weather, age, category, drive time
2. **suggest_activity_chain** - Recommend 2-3 activities that work well together
3. **get_activity_details** - Full activity info
4. **check_opening_hours** - Verify activity is open on date
5. **get_standbys** - Return favorites to revisit

**Scoring Algorithm:**

```typescript
// Use rating data from Step 1!
const baseScore = (rating_3yo + rating_5yo) / 2;

// Drive time penalty (exponential decay past 30min)
const driveTimePenalty = drive_time <= 30 ? 1.0 :
                        drive_time <= 60 ? 0.5 :
                        drive_time <= 90 ? 0.2 : 0;

// Novelty bonus (haven't been in a while)
const daysSinceVisit = daysSince(last_visited_at);
const noveltyScore = daysSinceVisit > 21 ? 1.2 :  // 3+ weeks
                     daysSinceVisit > 14 ? 1.0 :  // 2+ weeks
                     daysSinceVisit > 7 ? 0.8 : 0.5;

const finalScore = baseScore * driveTimePenalty * noveltyScore;
```

**Success Criteria:**
- Returns activities sorted by score
- Filters by weather (rainy → indoor activities)
- Age-appropriate filtering works (3-5 year olds)
- Standby rotation logic works ("haven't been to Frog Park in 3 weeks")

**Time Estimate:** 4 hours

---

#### Step 4: Implement Schedule Sync MCP Server (DAY 5 - 3 hours)

**Why third?**
- Needed by Orchestrator for calendar/weather checks
- Simpler than Orchestrator itself
- Some tools can have stub implementations for v1

**Implementation Guide:**

Tools to implement:
1. **get_weather_forecast** - Weather.gov API (FREE, no key needed)
   ```typescript
   // Oakland 94611: lat=37.8324, lon=-122.2128
   // Weather.gov API: https://api.weather.gov/points/{lat},{lon}
   ```

2. **check_calendar_conflicts** - Google Calendar API
   - **v1:** Return empty array (implement in Phase 3)
   - **v2:** Actual Google Calendar integration

3. **calculate_drive_time** - Use pre-calculated times from database
   ```typescript
   // Just query activity.drive_time_minutes from Supabase
   ```

4. **optimize_route** - Sort activities by proximity
   - **v1:** Simple sort by drive time
   - **v2:** Actual route optimization

5. **suggest_timing** - Create timeline with buffers
   ```typescript
   // Include: activity duration, drive time, meal breaks, transition buffers
   ```

**Success Criteria:**
- Weather forecast works for Oakland
- Drive times returned from database
- Timeline includes realistic buffers (15min transitions, 60min meals)

**Time Estimate:** 3 hours

---

#### Step 5: Implement Orchestrator MCP Server (DAY 6-7 - 6 hours)

**Why last?**
- Coordinates all other servers
- Most complex logic
- Depends on all other servers working

**Implementation Guide:**

Update `mcp-servers/orchestrator/src/index.ts`:

1. Import subagent tools:
   ```typescript
   import { FoodFinderTools } from '../food-finder/src/index.js';
   import { ActivityPlannerTools } from '../activity-planner/src/index.js';
   import { ScheduleSyncTools } from '../schedule-sync/src/index.js';
   ```

2. Implement **plan_weekend**:
   ```typescript
   async function planWeekend(args) {
     // 1. Get weather
     const weather = await ScheduleSyncTools.getWeather(args.date);

     // 2. Get 3 different activity suggestions
     const activities = await ActivityPlannerTools.suggestActivityChain({
       date: args.date,
       weather: weather.conditions,
       preferences: args.preferences
     });

     // 3. For each suggestion, find restaurants
     const withRestaurants = await Promise.all(
       activities.map(async (activity) => {
         const restaurants = await FoodFinderTools.matchRestaurantToActivity(
           activity.id, 'lunch'
         );
         return { ...activity, restaurants };
       })
     );

     // 4. Create timeline
     const timeline = await ScheduleSyncTools.suggestTiming(withRestaurants);

     // 5. Format for WhatsApp
     return formatForWhatsApp(withRestaurants, timeline, weather);
   }
   ```

3. Implement **get_day_plan** and **answer_question**

**Success Criteria:**
- Returns 3 complete weekend suggestions
- Each includes: activities + restaurants + timeline + weather
- Respects dietary restrictions
- Accounts for drive times
- Formats nicely for WhatsApp

**Time Estimate:** 6 hours

---

#### Step 6: Test End-to-End Flow (DAY 8 - 2 hours)

**Test via Claude Code CLI:**

```bash
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner"
# Start Claude Code session
```

**Test Query:**
```
Use the orchestrator tool to plan a weekend day:
plan_weekend(date: "2025-10-19", preferences: {weather: "sunny", attendees: ["david", "wife", "3yo", "5yo"]})
```

**Expected Output:**
```
🎪 Weekend Suggestions for Saturday, Oct 19

Weather: ☀️ 68°F, Sunny (perfect outdoor weather!)

━━━━━━━━━━━━━━━━━━━━
Option 1: Tilden Park Adventure
━━━━━━━━━━━━━━━━━━━━

🌳 9:00-11:00 - Tilden Little Farm
  Free, 25 min drive
  Kids loved this last time! (5yo: 5★, 3yo: 4★)
  Last visit: 8 weeks ago

🚂 11:15-11:45 - Tilden Steam Trains
  $4/person

🍽️ 12:30-1:30 - Comal (Berkeley)
  Mexican, celiac-safe ✓
  All allergens safe ✓

[... 2 more options ...]
```

**Success Criteria:**
- All 3 suggestions are realistic and actionable
- Restaurants are all dietary-safe
- Drive times are reasonable
- Activities match age range (3-5 years)
- Timing is realistic with buffers

---

## Part 3: Open Questions

### Decisions Needed Before Phase 3

#### Q1: API Integration Priority

**Question:** Which API should we integrate first?

**Options:**
1. **WhatsApp API** - Core user experience, but requires 2-7 day business verification
2. **Spotify API** - Concert discovery, requires OAuth setup
3. **Google Calendar** - Calendar conflicts, requires OAuth setup
4. **Weather.gov** - FREE, no API key needed (easiest)

**Recommendation:**
- **Day 9:** Weather.gov (2 hours) - already needed for Orchestrator testing
- **Day 10:** Submit WhatsApp Business verification (start waiting period)
- **Day 11-12:** Google Calendar OAuth (4 hours)
- **Day 13-14:** Spotify OAuth (4 hours)

**Rationale:** Weather is free and immediate. WhatsApp verification takes time, so start early. Calendar and Spotify can happen while waiting for WhatsApp approval.

---

#### Q2: n8n Hosting Strategy

**Question:** Should we use n8n Cloud (paid) or self-host (free)?

**Options:**

| Factor | n8n Cloud | Self-Hosted |
|--------|-----------|-------------|
| **Cost** | $20/month | $0 (use existing hardware) |
| **Setup** | 15 minutes | 2-3 hours |
| **Maintenance** | Zero | Moderate |
| **Uptime** | 99.9% | Depends on hardware |
| **Security** | Managed | Your responsibility |

**Recommendation:** **Start with n8n Cloud, migrate to self-hosted later if needed**

**Rationale:**
- $20/month is within budget
- Get to v1 faster (setup time: 15min vs 3hrs)
- Can always migrate later if cost becomes issue
- n8n Cloud has good export/import for migrations
- Focus on building features, not maintaining infrastructure

---

#### Q3: Music Scout Priority for v1

**Question:** Should Music Scout be included in v1 launch, or deferred to v2?

**Arguments for v1:**
- It's a unique differentiator
- Wife would love concert discovery
- Spotify integration is good learning experience

**Arguments for v2:**
- Requires OAuth complexity
- Not core to weekend planning feature
- Can launch without it
- v1 already has enough scope

**Recommendation:** **Defer to v2 (Fast-Follow)**

**Rationale:**
- v1 should focus on core weekend activity planning
- Concert discovery is a "nice to have" not "must have"
- Reduce v1 scope to hit launch faster
- Can add Music Scout in v2 within 2 weeks of v1 launch
- This reduces Phase 1 work by 4-6 hours

---

#### Q4: Bootstrap Rating Approach

**Question:** Should David rate all 75 activities alone, or involve wife?

**Options:**
1. **David solo** - Faster, but single perspective
2. **David + wife** - Better data, but coordination overhead
3. **David first, wife later** - Best of both

**Recommendation:** **David first, wife later**

**Approach:**
1. David rates 30-40 activities he remembers well (Day 1)
2. Test MCP servers with this baseline data (Days 2-8)
3. Invite wife to rate remaining activities once UI is proven (Day 9+)
4. Her ratings supplement and validate David's ratings

**Rationale:**
- Don't block development on coordination
- 30-40 ratings is enough to test algorithms
- Wife can add ratings async while you build
- Two perspectives improve recommendation quality

---

## Part 4: Operational Improvements

### MCP Server Recommendations

#### 1. Keep Supabase MCP in Read-Only Mode (for now)

**Current:** `--read-only` flag is set in `.mcp.json`

**Recommendation:** Keep it this way until Phase 3

**Rationale:**
- Prevents accidental data deletion during development
- Custom MCP servers use service role key for writes
- Can enable write mode later for admin tasks
- Read-only access is perfect for debugging and testing

---

#### 2. Add MCP Inspector for Debugging

**What:** Official MCP debugging tool from Anthropic

**Installation:**
```bash
npm install -g @modelcontextprotocol/inspector
```

**Usage:**
```bash
mcp-inspector mcp-servers/food-finder/build/index.js
```

**Benefits:**
- Test tools without full Claude Code session
- See raw JSON request/response
- Debug faster
- Validate tool schemas

**Priority:** Medium (helpful but not critical)

---

#### 3. Consider Adding Activity Search MCP Tool

**What:** Add search capability directly to Supabase MCP

**Why:**
- Currently can only list tables and run SQL
- Search would make debugging easier
- Could search activities by name, tags, city

**How:**
In `.mcp.json`, add `search` feature:
```json
{
  "mcpServers": {
    "supabase": {
      "args": [
        "--features=database,docs,search"
      ]
    }
  }
}
```

**Priority:** Low (nice to have)

---

### Development Workflow Improvements

#### 1. Add Pre-Commit Hooks for SQL Validation

**Problem:** SQL errors (like the ones fixed on Oct 9) waste time

**Solution:** Add SQL linting to git pre-commit hooks

**Implementation:**
```bash
npm install -D @sqlfluff/sqlfluff
```

Add to `.husky/pre-commit`:
```bash
#!/bin/sh
sqlfluff lint database/*.sql --dialect postgres
```

**Priority:** Low (prevents future errors, not urgent)

---

#### 2. Create MCP Server Test Suite

**What:** Automated tests for each MCP server

**Structure:**
```
mcp-servers/food-finder/
├── src/index.ts
├── tests/
│   ├── find_restaurants.test.ts
│   ├── check_dietary_safety.test.ts
│   └── match_restaurant.test.ts
└── package.json
```

**Benefits:**
- Catch regressions early
- Confidence when refactoring
- Documents expected behavior

**Priority:** Medium (add after v1 launch)

---

#### 3. Add Session Recording to Streamlit UI

**What:** Log all rating sessions to help debug

**Implementation:**
```python
# In streamlit_app.py
import logging

logging.basicConfig(
    filename='rating-sessions.log',
    level=logging.INFO,
    format='%(asctime)s - %(message)s'
)

# Log each rating
logging.info(f"Rated {activity_name}: 3yo={rating_3yo}, 5yo={rating_5yo}")
```

**Benefits:**
- Understand rating patterns
- Debug if data doesn't push correctly
- Analyze time spent rating

**Priority:** Low (nice for analytics)

---

### API Integration Improvements

#### 1. Use Weather.gov Instead of OpenWeatherMap

**Current plan:** OpenWeatherMap (requires API key)

**Better option:** Weather.gov (FREE, no key needed)

**Why:**
- Operated by NOAA (US National Weather Service)
- FREE, no rate limits for reasonable use
- No API key required
- More accurate for US locations
- Better Bay Area coverage

**Implementation:**
```typescript
const lat = 37.8324;
const lon = -122.2128;

// Step 1: Get grid endpoint
const pointData = await fetch(
  `https://api.weather.gov/points/${lat},${lon}`
).then(r => r.json());

// Step 2: Get forecast
const forecast = await fetch(
  pointData.properties.forecast
).then(r => r.json());
```

**Savings:** $0/month (vs potential OpenWeatherMap costs)

**Priority:** High (implement in Schedule Sync)

---

#### 2. Defer Concert API Integration to v2

**As discussed in Q3:** Music Scout can wait

**Benefits:**
- Reduces v1 scope by 6 hours
- Launches faster
- Simpler OAuth story (only Google Calendar for v1)

**Trade-off:** Wife won't get concert alerts in v1

**Mitigation:** Add in v2 fast-follow (2 weeks after v1 launch)

---

#### 3. Consider Twilio as WhatsApp Fallback

**Problem:** Meta WhatsApp verification can take 2-7 days (or longer)

**Fallback:** Twilio WhatsApp API
- Setup time: 1 hour
- Cost: $5-10/month
- No business verification required

**Strategy:**
1. Submit Meta verification on Day 10
2. If not approved by Day 20, use Twilio temporarily
3. Migrate to Meta once approved (saves $$)

**Priority:** Medium (contingency plan)

---

### Database Optimizations

#### 1. Add Full-Text Search to Activities

**What:** PostgreSQL full-text search for activity names/descriptions

**Implementation:**
```sql
-- Add tsvector column
ALTER TABLE activities ADD COLUMN search_vector tsvector;

-- Update column with search data
UPDATE activities SET search_vector =
  to_tsvector('english', name || ' ' || COALESCE(description, '') || ' ' || COALESCE(notes, ''));

-- Create index
CREATE INDEX activities_search_idx ON activities USING GIN(search_vector);

-- Create trigger to auto-update
CREATE TRIGGER activities_search_update
BEFORE INSERT OR UPDATE ON activities
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description, notes);
```

**Benefits:**
- Fast activity search in MCP tools
- "Find activities with 'playground' or 'water'" queries
- Better than LIKE queries

**Priority:** Medium (nice optimization for Phase 2)

---

#### 2. Create Materialized View for Top Activities

**What:** Pre-computed view of highly-rated activities

**Implementation:**
```sql
CREATE MATERIALIZED VIEW top_rated_activities AS
SELECT
  a.*,
  AVG(v.rating_overall) as avg_rating,
  COUNT(v.id) as visit_count,
  MAX(v.visited_at) as last_visit
FROM activities a
LEFT JOIN visits v ON a.id = v.activity_id
GROUP BY a.id
HAVING AVG(v.rating_overall) >= 4.0
ORDER BY avg_rating DESC, visit_count DESC;

-- Refresh materialized view weekly
REFRESH MATERIALIZED VIEW top_rated_activities;
```

**Benefits:**
- Faster "get standbys" queries
- Reduces load on visits table
- Can add to n8n weekly workflow

**Priority:** Low (optimize after v1)

---

#### 3. Add Geospatial Queries for "Nearby" Logic

**What:** Use PostGIS extension for distance calculations

**Implementation:**
```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column
ALTER TABLE activities ADD COLUMN location geography(POINT, 4326);

-- Populate from lat/lon
UPDATE activities
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography;

-- Query activities within 30 min drive (~20 miles)
SELECT * FROM activities
WHERE ST_DWithin(
  location,
  ST_SetSRID(ST_MakePoint(-122.2128, 37.8324), 4326)::geography,
  20 * 1609.34  -- 20 miles in meters
);
```

**Benefits:**
- More accurate than pre-calculated drive_time_minutes
- Can find "nearby" activities dynamically
- Enables map-based features in v2

**Priority:** Low (v2 enhancement)

---

## Part 5: Strategic Recommendations

### Mindset Shift: Planning → Execution

**Observation:** You have EXCELLENT planning and documentation. Seriously, it's impressive.

**But:** Plans don't create value - working software does.

**Recommendation:** **Timebox planning, bias toward building**

**Specifically:**
- Documentation is now complete (don't add more until v1 ships)
- No more architectural decisions until you hit a real problem
- Focus on implementation hours, not planning hours
- "Good enough" MCP tools > perfect documentation

**Mantra:** "Ship v1, learn from usage, iterate to v2"

---

### Reduce v1 Scope Aggressively

**Current v1 Scope (from PLAN.md):**
- 5 MCP servers
- 6 n8n workflows
- WhatsApp bot
- Spotify integration
- Google Calendar integration
- Concert discovery
- Event discovery
- Feedback collection

**Recommended v1 Scope:**
- 4 MCP servers (drop Music Scout)
- 3 n8n workflows (drop Spotify sync, concert discovery)
- WhatsApp bot
- Google Calendar integration (basic)
- Weather integration

**Drop to v2:**
- Music Scout entirely
- Event scraping (Eventbrite, Mommy Poppins)
- Ticket reminders
- Full Calendar integration (start with "no conflicts" stub)

**Rationale:**
- v1 is about **weekend activity planning**
- Concert discovery is a separate feature (bundle in v2)
- Event scraping is complex (wait for user demand)
- Launch faster with focused scope

**Timeline Impact:**
- Current estimate: 35-50 hours to v1
- Revised estimate: 25-35 hours to v1
- **Savings: ~15 hours**

---

### Parallelize Where Possible

**Current plan:** Sequential implementation (Food Finder → Activity Planner → etc.)

**Better approach:** Parallel work streams

**Example Week:**
- **Monday AM:** Bootstrap ratings (45 min)
- **Monday PM:** Start Food Finder implementation
- **Tuesday AM:** Continue Food Finder
- **Tuesday PM:** Start Activity Planner (different day, fresh mind)
- **Wednesday:** Finish both, test integration
- **Thursday:** Start Schedule Sync
- **Friday:** Implement Orchestrator

**Tools to enable parallelization:**
- Clear interfaces (already documented in IMPLEMENTATION-GUIDE.md)
- Stub implementations ("return empty array for now")
- Test each server standalone before integrating

---

### Build Measurement into v1

**What:** Track actual usage from day 1

**Implementation:**
Add to Supabase:
```sql
CREATE TABLE usage_metrics (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type text NOT NULL,  -- 'suggestion_viewed', 'activity_selected', 'whatsapp_message'
  user_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
```

**Track:**
- How many suggestions are viewed vs ignored
- Which activities are selected most often
- How long between suggestion and activity execution
- Which restaurants are picked
- Time of day for planning requests

**Why:**
- Informs v2 priorities
- Proves value (or lack thereof)
- Catches bugs ("no one clicked Option 3 ever")

**Implementation time:** 1 hour

**Priority:** Medium (add before wife starts using)

---

### Plan for Wife's Feedback Loop

**Problem:** You're building for wife, but she's not involved in development

**Recommendation:** **Create explicit feedback collection mechanism**

**Approach:**
1. **Week 1 (first 3 suggestions):**
   - After each weekend, ask: "What worked? What didn't?"
   - Note which suggestions she picked (or ignored)
   - Ask about restaurants (were they actually safe? tasty?)

2. **Week 2-4:**
   - Iterate based on Week 1 feedback
   - Tune scoring algorithm
   - Adjust suggestion format

3. **Month 2:**
   - Less frequent feedback
   - System should be "good enough" to use passively

**Add to n8n Workflow:**
```
Monday 8pm: "How was the weekend? Rate your experience 1-5 ⭐"
Tuesday: Analyze feedback, update preferences table
```

**Success Metric:** Wife uses it 3+ weekends without prompting

---

## Part 6: Execution Roadmap

### Week 1: Foundation → Working Demo

| Day | Hours | Task | Outcome |
|-----|-------|------|---------|
| 1 | 1h | Bootstrap ratings (30-40 activities) | visits table populated |
| 1-2 | 3h | Implement Food Finder MCP | Restaurant recommendations work |
| 2-3 | 4h | Implement Activity Planner MCP | Activity suggestions work |
| 3 | 3h | Implement Schedule Sync MCP | Weather + timing work |
| 4-5 | 6h | Implement Orchestrator MCP | End-to-end flow works |
| 5 | 2h | Test via Claude Code CLI | 3 weekend suggestions generated |
| **Total** | **19h** | **Core MCP infrastructure** | **v0.5 demo ready** |

**Outcome:** Can generate weekend plans via CLI

---

### Week 2: APIs → Automation

| Day | Hours | Task | Outcome |
|-----|-------|------|---------|
| 6 | 2h | Weather.gov integration | Real weather forecasts |
| 6 | 1h | Submit WhatsApp verification | Waiting period starts |
| 7-8 | 4h | Google Calendar OAuth setup | Calendar conflicts work |
| 8 | 2h | Set up n8n Cloud | Automation platform ready |
| 9-10 | 4h | Build Weekly Suggestions workflow | Thursday noon suggestions |
| 10 | 2h | Build Feedback Collection workflow | Monday night feedback |
| **Total** | **15h** | **API integration + automation** | **n8n workflows running** |

**Outcome:** Automated weekly suggestions (still CLI output, not WhatsApp yet)

---

### Week 3: WhatsApp → Launch

| Day | Hours | Task | Outcome |
|-----|-------|------|---------|
| 11-12 | 4h | WhatsApp bot conversation handler | Messages route to Orchestrator |
| 12 | 2h | Format suggestions for WhatsApp | Pretty WhatsApp messages |
| 13 | 3h | End-to-end testing | Full flow works |
| 13 | 1h | Wife onboarding | She can use it |
| 14 | 2h | Bug fixes from testing | Polish |
| **Total** | **12h** | **WhatsApp integration** | **v1 launched** |

**Outcome:** Wife receives automated weekend suggestions via WhatsApp

---

### Total Time to v1: ~46 hours

**Breakdown:**
- Week 1 (MCP servers): 19h
- Week 2 (APIs + automation): 15h
- Week 3 (WhatsApp + launch): 12h

**Calendar time:** 3-4 weeks (assuming 10-15 hours/week)

**vs Original Estimate:** 35-50 hours (this is within range)

---

## Part 7: Success Metrics

### v1 Launch Criteria (Must Have)

- [ ] Wife can send "What should we do Saturday?" via WhatsApp
- [ ] Bot responds with 3 weekend suggestions within 30 seconds
- [ ] Suggestions include: activities + restaurants + timing
- [ ] All restaurants are dietary-safe (celiac + allergens)
- [ ] Suggestions are realistic (drive times, age-appropriate)
- [ ] Weekly automated suggestions arrive Thursday noon
- [ ] Wife uses it 2+ weekends without prompting

**If these 7 criteria are met, v1 is successful**

---

### v1 "Nice to Have" (Not Required)

- [ ] Concert discovery
- [ ] Event scraping
- [ ] Spotify sync
- [ ] Social graph ("you haven't seen the Johnsons in 2 months")
- [ ] Photo memories
- [ ] Web dashboard

**These can wait for v2/v3**

---

### v2 Fast-Follow (Within 2 weeks of v1)

- [ ] Music Scout MCP server
- [ ] Spotify OAuth integration
- [ ] Concert discovery workflow
- [ ] Ticket reminders

**Timeline:** 8-10 hours additional work

**Value:** Unlocks concert discovery feature (wife would love this)

---

## Part 8: Risk Mitigation

### Risk 1: WhatsApp Verification Delay

**Probability:** Medium (can take 2-7 days, sometimes longer)

**Impact:** High (blocks v1 launch)

**Mitigation:**
- Submit verification early (Day 6)
- Have Twilio as backup ($5-10/month temporary)
- Can test with Twilio while waiting for Meta
- Meta approval is one-time, migrate when ready

**Contingency:** If Meta takes >2 weeks, launch v1 on Twilio, migrate later

---

### Risk 2: Rating Fatigue

**Probability:** Medium (75 activities is a lot)

**Impact:** Medium (less training data, but not blocking)

**Mitigation:**
- Only need 30-40 ratings minimum
- Focus on favorites first
- Wife can rate remaining activities async
- System works with partial ratings

**Contingency:** Launch with 30 ratings, continue rating as you use the system

---

### Risk 3: Recommendation Quality

**Probability:** Medium (first ML project with limited data)

**Impact:** High (wife won't use it if suggestions are bad)

**Mitigation:**
- Start with rule-based scoring (not ML)
- Use explicit preferences (documented in memory)
- Iterate based on feedback
- Manual tune scoring weights

**Contingency:** Add manual override ("always suggest Frog Park once a month")

---

### Risk 4: API Rate Limits

**Probability:** Low (personal use, low volume)

**Impact:** Medium (would cause errors)

**Mitigation:**
- All APIs have generous free tiers
- Cache aggressively (weather: 6 hours, calendar: 1 day)
- Add rate limit handling in MCP servers

**Contingency:** Implement exponential backoff + retry logic

---

### Risk 5: Scope Creep

**Probability:** High (you're a product leader, you'll think of features)

**Impact:** High (delays v1 indefinitely)

**Mitigation:**
- **BACKLOG.md is the friend here**
- Write ideas down, don't build them
- Review backlog quarterly, not daily
- Mantra: "Ship v1, learn, iterate"

**Contingency:** If new feature idea emerges, add to backlog, continue on v1

---

## Part 9: Next Session Checklist

Before starting next work session, do this:

### 1. Review This Document (5 min)
- Read Executive Summary
- Review Critical Path Forward
- Check current week's roadmap

### 2. Run Supabase Health Check (2 min)
```sql
-- In Supabase Dashboard SQL Editor
SELECT
  (SELECT COUNT(*) FROM activities) as activities,
  (SELECT COUNT(*) FROM restaurants) as restaurants,
  (SELECT COUNT(*) FROM visits) as visits,
  (SELECT COUNT(*) FROM venues) as venues;

-- Expected: 75, 25, 0, 5
-- After Step 1: visits should be 30+
```

### 3. Verify MCP Connection (1 min)
```bash
claude mcp list
# Should show: supabase ✓ Connected
```

### 4. Pick ONE Task from Roadmap (1 min)
Don't multitask. Finish one thing completely.

### 5. Set Timer for Task (1 min)
Use time estimates from roadmap. If you go over by 2x, stop and reassess.

---

## Part 10: Closing Thoughts

You have built an **exceptional foundation**. Seriously impressive documentation, thoughtful architecture, and clear vision.

**Now**: Execute ruthlessly.

**The gap between v0 and v1 is not more planning—it's typing code.**

**Recommendations:**
1. Bootstrap ratings tomorrow (45 minutes, unblock everything)
2. Implement Food Finder this week (3 hours, build confidence)
3. Activity Planner next week (4 hours, see it work)
4. Don't add new documentation until v1 ships
5. Ship v1 in 3 weeks, learn from wife's usage, iterate to v2

**You've got this.** The hardest part (planning and infrastructure) is done.

Now go build. 🚀

---

**End of Strategic Plan**
**Next Action:** Bootstrap ratings (Day 1, 45 minutes)
**Next Review:** After completing Week 1 roadmap
