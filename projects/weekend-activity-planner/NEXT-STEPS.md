# Weekend Activity Planner - Next Steps

**Current Status:** Phase 1 Foundation - ~75% Complete
**Last Updated:** 2025-10-09 (Post-Supabase Setup)
**Latest Session:** `building/session-logs/2025-10-09-supabase-setup-and-slash-commands.md`

---

## ✅ What's Been Built

### 1. Project Infrastructure (100%)
- ✅ Complete folder structure created
- ✅ `.gitignore` with comprehensive security patterns
- ✅ `.env.example` with all required API keys documented
- ✅ Project README with quick start guide
- ✅ `.claude/CLAUDE.md` project context

### 2. Building Documentation System (100%)
- ✅ `building/README.md` - Session resume guide
- ✅ `building/PLAN.md` - Complete 4-week implementation plan
- ✅ `building/PROGRESS.md` - Living progress tracker
- ✅ `building/DECISIONS.md` - 9 architectural decisions documented
- ✅ `building/ISSUES.md` - Problem tracking template
- ✅ `building/TESTING.md` - Comprehensive testing guide
- ✅ `building/API-REFERENCE.md` - All API documentation links
- ✅ `building/ENVIRONMENT-CHECKLIST.md` - Setup verification
- ✅ `building/LESSONS-LEARNED.md` - Insights capture
- ✅ `building/BACKLOG.md` - v2/v3 feature backlog
- ✅ `building/session-logs/2025-10-09-initial-setup.md` - First session log

### 3. Database (100%) ✅ COMPLETE
- ✅ **Supabase project created** (ID: ohdmrfyyavlkoflbbjsd)
- ✅ **schema.sql deployed** - 10 tables, 5 views, triggers
  - activities (75 records), restaurants (25 records), venues (5 records)
  - visits, events, concerts, people, preferences (empty, ready for use)
  - artist_preferences, suggestion_history (empty, ready for use)
- ✅ **Seed data loaded**:
  - 75 Oakland/East Bay activities (deduplicated)
  - 25 celiac-safe restaurants (Mexican focus)
  - 5 Bay Area concert venues
- ✅ **Configuration complete**:
  - `.env` file with Supabase credentials
  - Python virtual environment set up
  - Database connection verified

### 4. Rating UI (100%)
- ✅ Streamlit app (`rating-ui/streamlit_app.py`)
- ✅ Requirements.txt with dependencies
- ✅ README with usage instructions
- ✅ Features:
  - Visual rating interface
  - Separate ratings for 3yo and 5yo
  - Progress tracking
  - Local caching before Supabase push
  - Auto-advance to next unrated activity

### 5. MCP Servers (20%)
- ✅ Orchestrator skeleton created:
  - package.json with dependencies
  - tsconfig.json
  - src/index.ts with tool definitions and TODOs
- ⏸️ Activity Planner - **TODO**
- ⏸️ Music Scout - **TODO**
- ⏸️ Food Finder - **TODO**
- ⏸️ Schedule Sync - **TODO**

---

## 🔨 Immediate Next Steps (to complete Phase 1)

### Step 1: Bootstrap Ratings (45 minutes) ⭐ START HERE

**CRITICAL:** Rating data is required for recommendation algorithms to work!

```bash
cd /Users/dshein/Personal\ Projects/projects/weekend-activity-planner/rating-ui
pip install -r requirements.txt
streamlit run streamlit_app.py
```

**What to do:**
1. App will display activities from Supabase
2. Rate 30-40 activities you've actually visited:
   - **Focus on favorites:** Frog Park, Heather Farms, Adventure Playground, Fairyland, Oakland Zoo
   - **Rate separately for 3yo and 5yo** (they have different preferences!)
   - **Be honest:** Ratings train the recommendation algorithm
3. Click "Push to Supabase" when done
4. Verify in Supabase Dashboard: `SELECT * FROM visits;`

**Why this matters:** Without rating data, the Activity Planner can't score or recommend activities intelligently.

---

### Step 2: Implement Food Finder MCP Server (2-3 hours)

**Easiest server to start with** - straightforward database queries with dietary filtering.

```bash
cd mcp-servers/food-finder
npm init -y
npm install @modelcontextprotocol/sdk @supabase/supabase-js zod
```

**Tools to implement:**
- `find_restaurants(dietary_restrictions, drive_time_max, cuisine_preference)` - Query restaurants from Supabase
- `check_dietary_safety(restaurant_id)` - Verify allergen safety
- `get_restaurant_details(restaurant_id)` - Full restaurant info

**Focus:** Filter by `celiac_safe`, `sesame_free_options`, `cashew_free_options`, `flax_free_options`

---

### Step 3: Implement Activity Planner MCP Server (3-4 hours)

**Most important server** for core functionality.

**Tools to implement:**
- `query_activities(filters)` - Basic activity search
- `suggest_activity_chain(date, weather, attendees)` - Main recommendation engine
- `get_activity_details(activity_id)` - Full activity info
- `check_opening_hours(activity_id, date)` - Verify hours
- `get_standbys()` - Return favorite/frequently-visited activities

**Scoring algorithm:**
```typescript
score = (
  rating_weight * avg_rating +
  novelty_weight * (1 - visit_frequency) +
  drive_time_penalty * exp(-drive_time/30) +
  age_match_bonus +
  weather_match_bonus
)
```

---

### ~~Step 2: Set Up Supabase~~ ✅ COMPLETE

Database is already set up!
   SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

### Step 3: Bootstrap Rating Session (30-45 min)

1. Install Streamlit dependencies:
   ```bash
   cd rating-ui
   pip install -r requirements.txt
   ```

2. Run rating UI:
   ```bash
   streamlit run streamlit_app.py
   ```

3. Rate at least 30-40 activities (prioritize places you've been)

4. Click "Push to Supabase" when done

### Step 4: Complete Orchestrator Implementation (3-4 hours)

Implement the 3 main functions in `orchestrator/src/index.ts`:
- `planWeekend()` - Coordinate subagents for 3 suggestions
- `getDayPlan()` - Detailed planning for selected activities
- `answerQuestion()` - Handle follow-up questions

### Step 5: Implement Subagent Tools (8-12 hours total)

For each of the 4 subagent servers:
1. Implement tool functions
2. Connect to Supabase
3. Add API integrations (Spotify, Google Calendar, Weather)
4. Test standalone
5. Export tools for Orchestrator to import

---

## 📋 Phase 2: Automation & Integration (Week 2-3)

### Remaining Tasks:

1. **WhatsApp Cloud API Setup** (2-7 days for verification)
   - Register for Meta WhatsApp Cloud API
   - Submit business verification
   - Configure webhook in n8n

2. **Spotify OAuth Setup** (2 hours)
   - Create Spotify Developer app
   - Implement OAuth flow for David & wife
   - Store refresh tokens in Supabase

3. **Google Calendar Integration** (2 hours)
   - Create Google Cloud project
   - Enable Calendar API
   - Set up OAuth credentials
   - Get refresh token

4. **n8n Workflows** (4-6 hours)
   Create 6 workflows:
   - Weekly Suggestions (Thu 12pm)
   - Spotify Sync (Sun 11pm)
   - Concert Discovery (daily 10am)
   - Event Discovery (daily 2pm)
   - Feedback Collection (Mon 8pm)
   - Ticket Reminders (daily 6pm)

---

## 🎯 Quick Wins to Build Momentum

### Win 1: Test the Rating UI (15 min)
```bash
cd rating-ui
pip install -r requirements.txt
streamlit run streamlit_app.py
```
Even without Supabase, you can see the interface and test the flow.

### Win 2: Verify Database Schema (10 min)
1. Create Supabase account
2. Run schema.sql
3. Verify all 10 tables created
4. Run seed data
5. Check row counts

### Win 3: Build One Complete MCP Server (4 hours)
Pick the simplest one (Food Finder) and fully implement it:
- Proves the architecture works
- Creates a template for others
- Gives immediate value (restaurant recommendations)

---

## 📁 File Locations Reference

### Key Files to Continue Building:

```
mcp-servers/
├── orchestrator/src/index.ts       # TODO: Implement 3 main functions
├── activity-planner/               # TODO: Create package.json, src/
├── music-scout/                    # TODO: Create package.json, src/
├── food-finder/                    # TODO: Create package.json, src/
└── schedule-sync/                  # TODO: Create package.json, src/

database/
├── schema.sql                      # ✅ Ready to run
├── seed-activities.sql             # ✅ Ready to run
└── seed-restaurants.sql            # ✅ Ready to run

rating-ui/
├── streamlit_app.py                # ✅ Ready to run
└── requirements.txt                # ✅ Ready to install

building/
├── PROGRESS.md                     # 📝 Update as you build
├── ISSUES.md                       # 📝 Log any problems
└── session-logs/                   # 📝 Add new logs
```

---

## 🚀 How to Resume Building

1. **Read the latest session log:**
   ```
   building/session-logs/2025-10-09-initial-setup.md
   ```

2. **Check progress:**
   ```
   building/PROGRESS.md
   ```

3. **Pick up where we left off:**
   - Complete MCP server structure (see Step 1 above)
   - Set up Supabase (see Step 2 above)
   - Run bootstrap rating (see Step 3 above)

4. **Update docs as you go:**
   - Mark completed tasks in `PROGRESS.md`
   - Add issues to `ISSUES.md` if you encounter problems
   - Create new session log when you start next session

---

## 💡 Tips for Success

### Start Small
Don't try to build everything at once. Complete one server fully before moving to the next.

### Test Early
Test each component standalone before integrating:
- Test Supabase connection
- Test each MCP server independently
- Test n8n workflows one at a time

### Use the Documentation
Everything is documented in `building/`. When stuck:
1. Check TESTING.md for how to test
2. Check API-REFERENCE.md for API docs
3. Check DECISIONS.md for why things are built this way
4. Check ISSUES.md for similar problems

### Iterate on Prompts
The MCP server tool descriptions and system prompts will need tuning. Start simple, then refine based on actual usage.

---

## 📞 Getting Help

If you get stuck:
1. Check `building/TESTING.md` for debugging tips
2. Check `building/ISSUES.md` for known problems
3. Review `building/DECISIONS.md` for architectural context
4. Add new issue to ISSUES.md with details
5. Ask Claude Code for help (load relevant building/ docs)

---

## 🎉 Success Metrics

You'll know it's working when:
- ✅ Supabase has all tables with seed data
- ✅ Rating UI loads activities from Supabase
- ✅ At least 30 activities are rated
- ✅ One MCP server responds to tool calls
- ✅ Orchestrator can coordinate subagents
- ✅ WhatsApp sends test messages
- ✅ Weekly suggestions workflow runs
- ✅ Wife receives usable suggestions via WhatsApp

---

**Current Phase:** 1 (Foundation) - 70% complete
**Next Phase:** 2 (MCP Servers & Integration) - 0% complete

**Estimated time to v1 launch:** 2-3 weeks of focused work

---

*Keep building! You've got solid foundations in place.* 🚀
