# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# Weekend Activity Planner - Project Context

**Project:** Weekend Activity Planner
**Owner:** David Shein
**Location:** /Users/dshein/Personal Projects/projects/weekend-activity-planner
**Status:** 🚧 In Development (Phase 1 ~80% Complete)
**Last updated:** 2025-10-14

---

## 🎯 START HERE - Load Latest Context

**IMPORTANT:** Before starting any work, Claude Code should ALWAYS load these files to get the latest project state:

### Critical Context Files (Load in Order)

**Fast context loading (< 1000 tokens):**
1. **`.claude/project-status.json`** - Machine-readable current state (parse critical_blockers, next_tasks, system_health)
2. **`building/STRATEGIC-SUMMARY.md`** - 2-minute executive summary

**Deep context (reference as needed):**
3. **`building/STRATEGIC-PLAN.md`** - Full 20-page strategic plan (don't read upfront, reference when needed)
4. **`building/PROGRESS.md`** - Detailed progress tracking
5. **`building/session-logs/[most-recent].md`** - Last work session (check "Next Steps" section only)

### Quick Context Check
Run these commands to verify current state:
```bash
# Check database health
claude mcp list  # Should show: supabase ✓ Connected

# Check latest progress
cat building/PROGRESS.md | head -20

# Check for blockers
grep -A5 "Current Blockers" building/PROGRESS.md
```

### Session Start Checklist
Before accepting any task, verify:
- [ ] Parse `.claude/project-status.json` (critical_blockers, next_tasks)
- [ ] Read `building/STRATEGIC-SUMMARY.md` (< 2 min)
- [ ] Check latest session log "Next Steps" section
- [ ] Verify Supabase MCP connection is working
- [ ] Reference `building/STRATEGIC-PLAN.md` only if needed for specific details

**Why this matters:** Layered context loading saves tokens. JSON manifest + summary = < 1000 tokens vs 7,000+ tokens for full strategic plan.

**When to read full strategic plan:**
- Implementing complex features that need detailed guidance
- Making architectural decisions
- Understanding strategic rationale
- **NOT** for routine session startup

---

## Project Purpose

AI-powered weekend activity planning system for David's family (wife + kids ages 3 & 5) in Oakland, CA.

**Core problem:**
- Weekend planning is repetitive (same parks every time)
- Miss out on new events and ticketed experiences
- Hard to track what kids actually enjoyed
- Need dietary-aware restaurant suggestions (celiac + allergens)
- Want concert discovery for wife based on actual music taste

**Solution:**
Multi-agent AI system with WhatsApp bot interface, Spotify integration, and learning feedback loop.

---

## Family Context (from global memory)

### Children
- **Daughter:** ~5 years old
  - Dietary restrictions: sesame, cashew, flax
  - Currently at TRIS (The Renaissance School International)
- **Son:** ~3 years old
  - No dietary restrictions
  - No more nap times needed

### Parents
- **David:** Product leader, technical, uses Claude Code
- **Wife:**
  - Dietary restrictions: celiac (gluten-free required)
  - Music taste: Late 90s / early 00s (Goo Goo Dolls, Dashboard Confessional, Green Day, etc.)
  - Will use WhatsApp bot (not CLI)

### Location
- **Home:** Oakland, CA 94611 (Montclair neighborhood)
- **Max drive:** 90 minutes, but exponential decay past 30 minutes
- **Comfort zone:** 30 minutes or less
- **Coverage area:** Oakland, Berkeley, Walnut Creek, Lafayette, Orinda, SF

### Activity Preferences
- **Focus:** Movement and new experiences
- **Default activities:** Frog Park, Draquena Quarry Park, Heather Farms Park, Oakland Zoo, Fairyland, Adventure Playground, biking around Mills College
- **Food preferences:** Mexican cuisine (Tacos Oscar, Cholita Linda), ice cream at De La Creamery
- **Favorite spots:**
  - Frog Park (biking, playground, farmers market)
  - Heather Farms Park (post-swim lesson, bikes & scooters)
  - Adventure Playground Berkeley (messy creative play)
  - Cereal Cinema (rainy day activity)

---

## Project-Specific Instructions

### When Working on This Project

**Always check these files first:**
1. `building/README.md` - Session resume guide
2. `building/PROGRESS.md` - Current status
3. `building/ISSUES.md` - Known problems
4. `building/session-logs/[latest].md` - Last session context

**Architecture principles:**
- Direct tool calling (Option B) for agent communication
- Separate ratings for 3yo vs 5yo (different preferences)
- Drive time exponential decay past 30 minutes
- Balance novelty with standby favorites
- Always consider dietary restrictions for restaurants

**Security:**
- NEVER commit `.env` or API keys
- All secrets in `.env` (gitignored)
- Use `.env.example` as template

---

## Development Commands

### Building MCP Servers

```bash
# Build all MCP servers at once
for dir in mcp-servers/*; do
  echo "Building $(basename $dir)..."
  cd "$dir" && npm install && npm run build
  cd ../..
done

# Build individual server
cd mcp-servers/orchestrator && npm install && npm run build

# Run in development mode (watch for changes)
cd mcp-servers/orchestrator && npm run dev
```

### Database Setup

```bash
# 1. Create Supabase project at https://supabase.com
# 2. Get credentials from Settings > API

# 3. Apply schema
# In Supabase SQL Editor, paste contents of database/schema.sql

# 4. Load seed data
# Run database/seed-activities.sql (~75 activities)
# Run database/seed-restaurants.sql (~25 restaurants)

# 5. Verify tables exist
# SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```

### Rating UI

```bash
# Setup (one-time)
cd rating-ui
python3 -m venv .venv
source .venv/bin/activate  # On macOS
pip install -r requirements.txt

# Run Streamlit app
streamlit run streamlit_app.py
# Opens at http://localhost:8501
```

### Environment Setup

```bash
# 1. Copy template
cp .env.example .env

# 2. Fill in credentials (see building/API-REFERENCE.md for links)
# Required for Phase 1:
# - ANTHROPIC_API_KEY
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY

# 3. Verify environment
python3 setup_database.py --check-env
```

### Testing Commands

```bash
# Test MCP server builds
cd mcp-servers/orchestrator && npm run build

# Test Supabase connection from Python
cd rating-ui && python3 -c "from supabase import create_client; import os; from dotenv import load_dotenv; load_dotenv('../.env'); print('Connected!' if create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY')) else 'Failed')"

# Query activities count
# In Supabase SQL Editor: SELECT COUNT(*) FROM activities;

# Check TypeScript compilation
cd mcp-servers/orchestrator && npx tsc --noEmit
```

---

## MCP Server Architecture

### Current Implementation Status (Phase 1)

**⚠️ All MCP servers are SKELETON implementations with TODOs**

The servers have:
- ✅ Basic structure and tool definitions
- ✅ Supabase client initialization
- ✅ TypeScript types and error handling
- ❌ Actual implementation logic (marked with TODO comments)

### Server Communication Pattern

```typescript
// Orchestrator coordinates all subagents via direct tool calling
// Pattern used across all servers:

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env from project root (2 levels up from mcp-servers/*/src/)
dotenv.config({ path: '../../.env' });

// Initialize Supabase with SERVICE_ROLE_KEY for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```

### Tool Calling Flow

```
User (WhatsApp) → n8n → Orchestrator MCP Server
                           ↓
         ┌─────────────────┴─────────────────┐
         ↓                 ↓                  ↓
   Activity Planner   Music Scout      Food Finder
         ↓                 ↓                  ↓
         └─────────────────┬─────────────────┘
                           ↓
                   Schedule Sync
                           ↓
                   Format Response
                           ↓
                   n8n → WhatsApp
```

### Server Responsibilities

**Orchestrator** (`mcp-servers/orchestrator/`)
- Tools: `plan_weekend`, `get_day_plan`, `answer_question`
- Coordinates all other servers
- Handles WhatsApp conversation context

**Activity Planner** (`mcp-servers/activity-planner/`)
- Tools: `query_activities`, `suggest_activity_chain`, `check_opening_hours`
- Filters by age, weather, indoor/outdoor
- Applies drive time decay logic

**Music Scout** (`mcp-servers/music-scout/`)
- Tools: `sync_spotify_preferences`, `find_concerts`, `get_concert_details`
- Pulls from Spotify API
- Matches concerts to listening history

**Food Finder** (`mcp-servers/food-finder/`)
- Tools: `find_restaurants`, `match_restaurant_to_activity`, `check_dietary_safety`
- CRITICAL: Always filter by dietary restrictions (celiac, sesame, cashew, flax)

**Schedule Sync** (`mcp-servers/schedule-sync/`)
- Tools: `check_calendar_conflicts`, `get_weather_forecast`, `calculate_drive_time`, `suggest_timing`
- Google Calendar integration
- Weather API integration

---

## Database Schema & Query Patterns

### Core Tables

**activities** - Parks, museums, playgrounds
```sql
-- Age-appropriate filtering (3-5 year olds)
SELECT * FROM activities
WHERE age_min <= 3 AND age_max >= 5
  AND drive_time_minutes <= 30
  AND indoor_outdoor IN ('outdoor', 'both')
ORDER BY avg_rating DESC NULLS LAST, times_visited DESC;
```

**restaurants** - Dietary-safe dining options
```sql
-- CRITICAL: Always check dietary restrictions
SELECT * FROM restaurants
WHERE celiac_safe = true
  AND sesame_free_options = true
  AND cashew_free_options = true
  AND flax_free_options = true
  AND cuisine = 'mexican'
  AND drive_time_minutes <= 30
ORDER BY avg_rating DESC NULLS LAST;
```

**visits** - Rating history with age-specific feedback
```sql
-- Get visit history with separate child ratings
SELECT
  a.name,
  v.visited_at,
  v.rating_3yo,  -- Separate rating for younger child
  v.rating_5yo,  -- Separate rating for older child
  v.rating_overall,
  v.notes
FROM visits v
JOIN activities a ON v.activity_id = a.id
WHERE v.rating_3yo >= 4 OR v.rating_5yo >= 4
ORDER BY v.visited_at DESC;
```

**concerts** - Music discovery
```sql
-- Find relevant concerts
SELECT
  c.*,
  v.name as venue_name,
  v.drive_time_minutes
FROM concerts c
JOIN venues v ON c.venue_id = v.id
WHERE c.event_date >= CURRENT_DATE
  AND c.event_date <= CURRENT_DATE + INTERVAL '6 months'
  AND v.drive_time_minutes <= 90
ORDER BY c.relevance_score DESC, c.event_date ASC;
```

### Important Indexes

All tables indexed on:
- Drive time (`drive_time_minutes`)
- City location
- Rating fields
- Timestamps (`created_at`, `updated_at`)

### Triggers

All tables have auto-updating `updated_at` timestamp via trigger.

---

## Tech Stack Details

### Database (Supabase)
- **Why Supabase:** Better learning experience than Google Sheets, proper relational DB
- **Tables:** activities, restaurants, visits, events, people, preferences, artist_preferences, concerts, venues
- **Age tracking:** Separate rating fields for 3yo and 5yo
- **Dietary tracking:** Flags for celiac, sesame, cashew, flax

### Agents (MCP Servers)
- **Orchestrator:** Main coordinator, handles WhatsApp conversations
- **Music Scout:** Spotify integration, concert discovery
- **Activity Planner:** Kid activities, age-appropriate filtering
- **Food Finder:** Dietary-safe restaurant recommendations
- **Schedule Sync:** Calendar integration, weather, logistics

**Why multi-agent:** Easier debugging, focused prompts, scalable architecture

### Automation (n8n)
**6 workflows:**
1. Weekly Suggestions (Thursday noon)
2. Spotify Sync (Sunday 11pm)
3. Concert Discovery (daily 10am)
4. Event Discovery (daily 2pm)
5. Feedback Collection (Monday 8pm PST)
6. Ticket Reminders (daily 6pm)

### Interface
- **Primary:** WhatsApp bot (wife will actually use this)
- **Secondary:** Claude Code CLI (David for power user features)
- **v2:** Web dashboard (Streamlit or React)

---

## Key Decisions (from building/DECISIONS.md)

1. **Supabase over Google Sheets** - Better learning, proper database, scales better
2. **Multi-agent architecture** - 5 specialized servers for easier maintenance
3. **Direct tool calling** - Cleaner than database message bus
4. **WhatsApp bot first** - Zero friction, wife will use it
5. **Spotify integration** - Auto-learn concert preferences, no manual list
6. **Meta WhatsApp Cloud API** - Free tier, worth the 2-7 day wait
7. **Separate ratings per child** - 3yo and 5yo have different interests
8. **Streamlit rating UI** - Better UX than CLI for bootstrap rating
9. **Drive time exponential decay** - Realistic for young kids

---

## Current Phase: Phase 1 - Foundation

### Implementation Status

- [x] Project structure and documentation
- [x] Building/ session tracking system
- [x] Security files (.gitignore, .env.example)
- [x] Project context (.claude/CLAUDE.md)
- [x] Supabase database schema (database/schema.sql)
- [x] Activity seed data (~75 Oakland/East Bay activities)
- [x] Restaurant seed data (~25 celiac-safe, Mexican-focused)
- [x] MCP server skeletons (all 5 servers with TODO implementations)
- [ ] Streamlit rating UI implementation
- [ ] Bootstrap rating session
- [ ] Complete MCP server implementations
- [ ] n8n workflow setup

**Next up:** Implement Streamlit rating UI, then complete MCP server logic

---

## Dietary Restrictions (Critical)

### Wife: Celiac (Gluten-Free Required)
- No wheat, barley, rye
- Cross-contamination is serious concern
- Mexican restaurants often safer (corn tortillas)
- Known safe spots: Tacos Oscar, Cholita Linda

### Daughter: Sesame + Cashew + Flax
- Must avoid all three allergens
- Check restaurant ingredients carefully
- Include in all restaurant queries

**Important:** ALL restaurant suggestions MUST account for these restrictions.

---

## Geographic Constraints

### Drive Time Rules
- **0-30 min:** Normal weighting, suggest freely
- **30-60 min:** Require higher rating or novelty
- **60-90 min:** Only exceptional experiences
- **>90 min:** Don't suggest

### Home Base
- **Address:** Oakland, CA 94611 (Montclair)
- **Coordinates:** 37.8324, -122.2128

### Coverage Areas (in order of preference)
1. Oakland (esp. Montclair, Rockridge, Temescal)
2. Berkeley
3. Walnut Creek / Lafayette / Orinda
4. SF (special occasions only, >30min)
5. Peninsula / South Bay (rare, needs strong justification)

---

## Activity Types

### Existing Favorites (Rotation Standbys)
- Parks with playgrounds + biking (Frog Park, Heather Farms, Draquena Quarry)
- Larger attractions (Oakland Zoo, Fairyland)
- Creative messy play (Adventure Playground)
- Indoor rainy day (Cereal Cinema)
- Farmers markets (Saturday mornings)

### Desired New Experiences
- Museums (Lawrence Hall of Science, Chabot Space & Science Center)
- Nature/hiking (Tilden Park, Redwood Regional)
- Water activities (Lake Merritt, beaches)
- Seasonal (pumpkin patches, holiday events)
- Cultural events (festivals, performances)
- New playgrounds and parks

### Balance
- Don't over-optimize for novelty
- Include standbys regularly
- "You haven't been to Frog Park in 3 weeks" is a valid suggestion

---

## Concert Discovery (Wife)

### Target Artists (examples, will pull from Spotify)
- Goo Goo Dolls
- Dashboard Confessional
- Green Day
- Jimmy Eat World
- Blink-182
- Third Eye Blind
- Taking Back Sunday
- Modest Mouse
- The National
- etc.

### Venues
- **Preferred:** Fox Theater Oakland, The Fillmore, Greek Theatre
- **Acceptable:** Independent, Warfield, smaller venues
- **Range:** Within 90 min (SF, East Bay, possibly San Jose)

### Notification Timing
- 6-12 months ahead for ticketed shows
- Immediate notification when discovered
- Ticket purchase reminders < 2 weeks out

---

## Quick Health Check

Run these commands to verify the system is working:

```bash
# 1. Verify environment variables are set
grep -E "SUPABASE_URL|ANTHROPIC_API_KEY" .env | wc -l
# Should output: 2 (or more if other keys set)

# 2. Build all MCP servers
for dir in mcp-servers/*; do
  echo "Testing $(basename $dir)..."
  cd "$dir" && npm run build 2>&1 | grep -q "error" && echo "❌ Failed" || echo "✅ Built"
  cd ../..
done

# 3. Check database has data
# In Supabase SQL Editor:
# SELECT
#   (SELECT COUNT(*) FROM activities) as activities,
#   (SELECT COUNT(*) FROM restaurants) as restaurants,
#   (SELECT COUNT(*) FROM venues) as venues;
# Should show: ~75 activities, ~25 restaurants, ~5 venues

# 4. Test Streamlit UI launches
cd rating-ui && streamlit run streamlit_app.py &
# Open browser to http://localhost:8501
# You should see activity rating interface
```

See `building/TESTING.md` for comprehensive testing guide.

---

## Common Workflows

### Starting a New Session
1. Read `building/session-logs/[latest].md`
2. Check `building/PROGRESS.md`
3. Review `building/ISSUES.md` for blockers
4. Continue from last stopping point

### After Completing a Feature
1. Update `building/PROGRESS.md`
2. Add session log entry
3. Test the feature (see `building/TESTING.md`)
4. Update `building/ISSUES.md` if problems found

### When Stuck
1. Check `building/DECISIONS.md` for rationale
2. Review `building/API-REFERENCE.md` for API docs
3. Look at `building/ISSUES.md` for similar problems
4. Add new issue if novel problem

---

## Coding Conventions

### MCP Servers (TypeScript)
- Use async/await for database calls
- Proper error handling with try/catch
- Return structured responses
- Include helpful error messages
- Type all parameters and returns

### Python (Streamlit, scripts)
- Follow PEP 8
- Type hints where helpful
- Clear function docstrings
- Handle errors gracefully

### SQL (Supabase)
- Use snake_case for tables and columns
- Include timestamps (created_at, updated_at)
- Foreign keys with proper constraints
- Indexes on frequently queried fields

### n8n Workflows
- Clear node naming
- Comments explaining logic
- Error handling nodes
- Descriptive variable names

---

## Success Metrics

**We'll know it's working when:**
- ✅ Thursday noon: WhatsApp delivers 3 personalized suggestions
- ✅ Concert alerts arrive based on Spotify listening
- ✅ No suggestions conflict with calendar
- ✅ Weather is considered (rain backups offered)
- ✅ All restaurant suggestions are dietary-safe
- ✅ Suggestions improve week over week
- ✅ Wife uses it without prompting
- ✅ Kids enjoy >80% of suggested activities

---

## Monthly Operating Budget

**Target:** $5-10/month

**Breakdown:**
- Supabase: $0 (free tier sufficient)
- WhatsApp: $0 (Meta free tier, 1k conversations)
- Anthropic API: $5-10 (main cost)
- Spotify: $0 (free tier)
- Google Calendar: $0 (free)
- Weather: $0 (Weather.gov or OWM free tier)
- Concert APIs: $0 (free for non-commercial)

**If costs exceed $15/month:** Investigate, likely API usage issue.

---

## Project Structure

```
weekend-activity-planner/
├── .claude/
│   └── CLAUDE.md              # This file - project context for Claude Code
├── building/                   # Session documentation & tracking
│   ├── README.md              # How to resume development
│   ├── PLAN.md                # 4-week implementation plan
│   ├── PROGRESS.md            # Current status tracker
│   ├── DECISIONS.md           # Architecture decision log
│   ├── ISSUES.md              # Known problems & solutions
│   ├── TESTING.md             # Test guide
│   ├── API-REFERENCE.md       # API documentation links
│   ├── ENVIRONMENT-CHECKLIST.md  # Setup verification
│   ├── IMPLEMENTATION-GUIDE.md   # Detailed build guide
│   ├── LESSONS-LEARNED.md     # Development insights
│   ├── BACKLOG.md             # v2/v3 features
│   └── session-logs/          # Timestamped session notes
├── database/
│   ├── schema.sql             # Supabase database schema (10 tables, 5 views)
│   ├── seed-activities.sql    # ~75 Oakland/East Bay activities
│   └── seed-restaurants.sql   # ~25 celiac-safe restaurants
├── mcp-servers/               # 5 TypeScript MCP servers
│   ├── orchestrator/          # Main coordinator (plan_weekend, get_day_plan)
│   ├── activity-planner/      # Kid activities (query_activities, suggest_chain)
│   ├── music-scout/           # Concert discovery (sync_spotify, find_concerts)
│   ├── food-finder/           # Restaurants (find_restaurants, check_dietary)
│   └── schedule-sync/         # Calendar/weather (check_conflicts, get_forecast)
├── n8n-workflows/             # 6 automation workflows (currently empty)
├── rating-ui/                 # Streamlit bootstrap rating interface
│   ├── streamlit_app.py       # Main app (TODO: implement)
│   ├── requirements.txt       # Python dependencies
│   └── README.md              # Rating UI guide
├── docs/
│   └── SETUP.md               # Full setup guide
├── .env.example               # Environment template (copy to .env)
├── .gitignore                 # Security patterns
├── README.md                  # Project overview
└── START-HERE.md              # Quick orientation guide
```

### Key File Locations

**Before starting work:**
- Read: `building/README.md` → `building/PROGRESS.md` → `building/session-logs/[latest].md`

**When implementing:**
- Reference: `building/PLAN.md` for overall structure
- Check: `building/DECISIONS.md` for architectural rationale
- Document issues: `building/ISSUES.md`

**For testing:**
- Guide: `building/TESTING.md`
- Environment: `building/ENVIRONMENT-CHECKLIST.md`

**For API integration:**
- Links: `building/API-REFERENCE.md`

---

## Supabase MCP Server

### Configuration (Read-Only Mode)

The project uses the official Supabase MCP server for database access during development.

**Current Setup:**
- **Package:** `@supabase/mcp-server-supabase@latest`
- **Project Reference:** `ohdmrfyyavlkoflbbjsd`
- **Mode:** Read-only (`--read-only` flag)
- **Features:** `database` and `docs` only
- **Config file:** `.mcp.json` (project root)

### Authentication Setup

The Supabase MCP requires authentication. Choose one method:

#### Method A: OAuth Login (Recommended)
1. Try to use any Supabase MCP tool in Claude Code
2. Browser window will open automatically
3. Login to your Supabase account
4. Grant access to the MCP client
5. Select the correct organization

#### Method B: Personal Access Token
If OAuth doesn't work, use a personal access token:

1. Visit: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a name (e.g., "Weekend Planner MCP")
4. Copy the token (starts with `sbp_`)
5. Add to `.env`:
```bash
SUPABASE_ACCESS_TOKEN=sbp_your_token_here
```
6. Restart Claude Code

### Available MCP Tools

Once authenticated, these tools are available:

**Database Operations:**
- `list_tables` - List all database tables
- `describe_table` - Show table schema and columns
- `query_database` - Execute read-only SQL queries
- `get_table_data` - Fetch rows from a table
- `search_tables` - Full-text search across tables

**Documentation:**
- `search_docs` - Search Supabase documentation
- `get_doc` - Retrieve specific documentation page

### Usage Examples

```typescript
// List all tables
mcp__supabase__list_tables()

// Describe activities table
mcp__supabase__describe_table({ table_name: "activities" })

// Query dietary-safe restaurants
mcp__supabase__query_database({
  query: `
    SELECT name, cuisine, celiac_notes
    FROM restaurants
    WHERE celiac_safe = true
    ORDER BY avg_rating DESC NULLS LAST
    LIMIT 10
  `
})

// Count activities
mcp__supabase__query_database({
  query: "SELECT COUNT(*) as total FROM activities"
})

// Get visit history with ratings
mcp__supabase__query_database({
  query: `
    SELECT a.name, v.rating_3yo, v.rating_5yo, v.notes
    FROM visits v
    JOIN activities a ON v.activity_id = a.id
    ORDER BY v.visited_at DESC
    LIMIT 20
  `
})
```

### Upgrading to Write Mode

**When to upgrade:** After Phase 1, when implementing n8n workflows that need to insert/update data.

**Steps to enable write access:**

1. Edit `.mcp.json`:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--project-ref=ohdmrfyyavlkoflbbjsd",
        // REMOVE the --read-only flag below:
        // "--read-only",
        "--features=database,docs,functions"  // Add functions if needed
      ]
    }
  }
}
```

2. Restart Claude Code for changes to take effect

3. **IMPORTANT:** Be very careful with write operations:
   - Always review SQL before execution
   - Test with small datasets first
   - Have backups of your data
   - Use transactions when possible

### Security Best Practices

✅ **Current (Read-Only Mode):**
- Cannot accidentally modify or delete data
- Safe for exploration and testing
- Good for Phase 1 development

⚠️ **When in Write Mode:**
- Manually review every INSERT/UPDATE/DELETE
- Never expose to end users
- Only use in development environment
- Consider using database branching for testing

### Troubleshooting

**MCP Server Failed to Connect:**
- Check internet connection
- Verify project-ref is correct: `ohdmrfyyavlkoflbbjsd`
- Try Method B (Personal Access Token)
- Restart Claude Code

**Tools Not Available:**
- Run `claude mcp list` to verify server status
- Check `.mcp.json` syntax is valid
- Ensure `enableAllProjectMcpServers: true` in `.claude/settings.local.json`

**Authentication Errors:**
- Regenerate personal access token
- Ensure token is in `.env` as `SUPABASE_ACCESS_TOKEN`
- Check token hasn't expired (visit dashboard)

---

## Links

- **Project root:** `/Users/dshein/Personal Projects/projects/weekend-activity-planner`
- **Building docs:** `building/README.md`
- **Progress tracker:** `building/PROGRESS.md`
- **Master plan:** `building/PLAN.md`
- **API reference:** `building/API-REFERENCE.md`
- **Testing guide:** `building/TESTING.md`
- **Supabase MCP config:** `.mcp.json`

---

## Notes for Claude Code

When working on this project:
- **Load building/ docs first** to understand current status
- **Check PROGRESS.md** before starting work
- **Update session logs** as you build
- **Document decisions** in DECISIONS.md
- **Track issues** in ISSUES.md
- **Security first**: Never commit .env or secrets

**Communication style:**
- Use David's preferred explanatory style (from global memory)
- Provide educational insights about implementation choices
- Be clear and direct
- Focus on actionable information

---

*This context file is loaded automatically when Claude Code works in this project directory.*
