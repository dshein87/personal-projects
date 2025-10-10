# Weekend Activity Planner - Project Context

**Project:** Weekend Activity Planner
**Owner:** David Shein
**Location:** /Users/dshein/Personal Projects/projects/weekend-activity-planner
**Status:** 🚧 In Development (Phase 1 - Foundation)
**Last updated:** 2025-10-09

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

### What We're Building Now

- [x] Project structure and documentation
- [x] Building/ session tracking system
- [x] Security files (.gitignore, .env.example)
- [x] Project context (.claude/CLAUDE.md)
- [ ] Supabase database schema
- [ ] Activity seed data (~75 Oakland/East Bay activities)
- [ ] Restaurant seed data (~25 celiac-safe, Mexican-focused)
- [ ] Streamlit rating UI
- [ ] Bootstrap rating session

**Next up:** Database schema design

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

## Testing This Project

### Quick Health Check
```bash
# From project root
cd /Users/dshein/Personal Projects/projects/weekend-activity-planner

# Check all MCP servers build
for dir in mcp-servers/*; do
  cd $dir && npm run build || echo "Failed: $dir"
  cd ../..
done

# Check Supabase connection
# (run from rating-ui or MCP server)

# Test Streamlit UI
cd rating-ui && streamlit run streamlit_app.py
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

## Links

- **Project root:** `/Users/dshein/Personal Projects/projects/weekend-activity-planner`
- **Building docs:** `building/README.md`
- **Progress tracker:** `building/PROGRESS.md`
- **Master plan:** `building/PLAN.md`
- **API reference:** `building/API-REFERENCE.md`
- **Testing guide:** `building/TESTING.md`

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
