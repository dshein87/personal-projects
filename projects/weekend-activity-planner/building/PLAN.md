# Weekend Activity Planner - Master Implementation Plan

**Created:** 2025-10-09
**Timeline:** 4 weeks to v1 launch
**Cost:** ~$5-10/month (Anthropic API only)

---

## Project Overview

### Goal
Build an AI-powered family activity planner for weekends with kids (ages 3 & 5) in Oakland, CA (94611).

### Core Problem
- Weekend planning is repetitive (same parks, same activities)
- Miss out on new events and ticketed experiences
- Hard to discover concerts for wife based on music taste
- Need dietary-aware restaurant suggestions
- Want multi-activity day planning with logistics

### Solution
Multi-agent AI system with:
- Proactive weekly suggestions
- Spotify-powered concert discovery
- Calendar integration
- Weather-aware planning
- Dietary-safe recommendations
- Learning feedback loop
- WhatsApp bot interface

---

## Architecture

### Tech Stack
- **Database**: Supabase (PostgreSQL, free tier, cloud-hosted)
- **Agents**: 5 MCP servers with direct tool calling (Option B)
- **Automation**: n8n (6 workflows)
- **Messaging**: WhatsApp Cloud API (Meta, free tier)
- **Rating UI**: Streamlit (local)
- **APIs**: Spotify, Google Calendar, Weather, Songkick/Bandsintown

### Agent Architecture

```
Orchestrator (main coordinator)
├── Music Scout (concert discovery via Spotify)
├── Activity Planner (kid activities, parks, museums)
├── Food Finder (restaurants with dietary restrictions)
└── Schedule Sync (calendar, weather, logistics)
```

### Data Model

**Core Tables:**
- `activities` - Venues, parks, museums, playgrounds
- `restaurants` - Dietary restriction flags
- `visits` - History with ratings (separate for 3yo & 5yo)
- `events` - Discovered events with ticket info
- `people` - Friends/family, last seen tracking
- `preferences` - Learned preferences over time
- `artist_preferences` - Spotify sync data
- `concerts` - Discovered shows with ticket status
- `venues` - Concert venue database

---

## Phase 1: Foundation & Infrastructure (Week 1)

### 1.1 Project Structure Setup
- [x] Create folder hierarchy
- [ ] Set up `.gitignore` with `.env` exclusions
- [ ] Create `.env.example` templates
- [ ] Initialize git for project tracking
- [ ] Create building/ documentation system

### 1.2 Supabase Setup
- [ ] Create Supabase account (free tier)
- [ ] Design complete database schema
- [ ] Implement schema with proper types and indexes
- [ ] Configure authentication
- [ ] Set up API keys in `.env`

### 1.3 Activity & Restaurant Research
- [ ] Research ~75 Oakland/East Bay activities:
  - Parks & Playgrounds (20-25)
  - Museums & Indoor (15-20)
  - Outdoor Adventures (15-20)
  - Seasonal/Special (10-15)
- [ ] Research ~25 family restaurants:
  - Mexican cuisine focus
  - Celiac-safe options (wife)
  - Sesame/cashew/flax-aware (daughter)
  - Include opening hours
  - Note reservation requirements
- [ ] Add drive times (exponential decay past 30 min)
- [ ] Populate Supabase with seed data

### 1.4 Local Rating UI (Streamlit)
- [ ] Build Streamlit app
- [ ] Features:
  - Visual activity details
  - Rating form (separate ratings for 3yo & 5yo)
  - Have you been? / Stars / Would return?
  - Last visited / Notes / Tags
  - Keyboard navigation
  - Progress tracking
  - Save to local SQLite → push to Supabase
- [ ] Bootstrap rating session (~30 min)

---

## Phase 2: MCP Server Architecture (Week 2)

### 2.1 Orchestrator MCP Server
- [ ] Create `mcp-servers/orchestrator/`
- [ ] Main coordination logic
- [ ] Tools:
  - `plan_weekend(date, preferences)`
  - `get_day_plan(date, activity_ids)`
  - `answer_question(question, context)`
- [ ] Direct tool calling to subagents (Option B)
- [ ] WhatsApp conversation flow handling

### 2.2 Activity Planner MCP Server
- [ ] Create `mcp-servers/activity-planner/`
- [ ] Tools:
  - `query_activities(filters, weather, age_range)`
  - `suggest_activity_chain(date, duration, preferences)`
  - `get_activity_details(activity_id)`
  - `check_opening_hours(activity_id, date)`
  - `get_standbys(last_visit_days_ago)`
- [ ] Age-specific logic (3yo vs 5yo)
- [ ] Novelty vs standby balancing

### 2.3 Music Scout MCP Server
- [ ] Create `mcp-servers/music-scout/`
- [ ] Tools:
  - `sync_spotify_preferences(user_id)`
  - `find_concerts(artists, location, date_range)`
  - `get_concert_details(concert_id)`
  - `check_ticket_availability(concert_id)`
- [ ] Spotify OAuth integration
- [ ] Late 90s/early 00s artist focus

### 2.4 Food Finder MCP Server
- [ ] Create `mcp-servers/food-finder/`
- [ ] Tools:
  - `find_restaurants(cuisine, dietary_needs, location)`
  - `match_restaurant_to_activity(activity_id, meal_time)`
  - `get_restaurant_details(restaurant_id)`
  - `check_dietary_safety(restaurant_id, restrictions)`
- [ ] Dietary restriction handling:
  - Celiac (wife)
  - Sesame (daughter)
  - Cashew (daughter)
  - Flax (daughter)

### 2.5 Schedule Sync MCP Server
- [ ] Create `mcp-servers/schedule-sync/`
- [ ] Tools:
  - `check_calendar_conflicts(date_range)`
  - `get_weather_forecast(date, location)`
  - `calculate_drive_time(origin, destination)`
  - `optimize_route(activity_list)`
  - `suggest_timing(activities, buffers)`
- [ ] Google Calendar integration
- [ ] Realistic travel time buffers

### 2.6 API Keys & Environment Setup
- [ ] Anthropic API key setup
- [ ] Supabase credentials
- [ ] Spotify OAuth credentials
- [ ] Google Calendar API setup
- [ ] Weather API (OpenWeatherMap or Weather.gov)
- [ ] WhatsApp API token
- [ ] Songkick & Bandsintown API keys
- [ ] All keys in `.env` (gitignored)
- [ ] Create `.env.example` template

### 2.7 Testing via Claude Code CLI
- [ ] Test each MCP server independently
- [ ] Test orchestrator coordination
- [ ] Iterate on suggestion quality
- [ ] Refine prompts and logic

---

## Phase 3: Automation & WhatsApp Integration (Week 3)

### 3.1 WhatsApp Cloud API Setup
- [ ] Register for Meta WhatsApp Cloud API
- [ ] Submit business verification (2-7 days)
- [ ] Configure webhook endpoint (via n8n)
- [ ] Test message sending/receiving
- [ ] Add credentials to `.env`

### 3.2 Spotify OAuth Flow
- [ ] Create Spotify Developer app
- [ ] Implement OAuth for David & wife
- [ ] Store refresh tokens in Supabase
- [ ] Test artist preference sync
- [ ] Add credentials to `.env`

### 3.3 n8n Project Setup
- [ ] Create new n8n project
- [ ] Install required nodes
- [ ] Configure environment variables

### 3.4 Build n8n Workflows

**Workflow 1: Weekly Suggestions** (Thursday 12pm)
- [ ] Cron trigger
- [ ] Check Google Calendar for weekend
- [ ] Get weather forecast
- [ ] Query activities (novelty + standbys)
- [ ] Call Orchestrator for 3 suggestions
- [ ] Send WhatsApp message

**Workflow 2: Spotify Sync** (Sunday 11pm)
- [ ] Cron trigger
- [ ] Call Spotify API (both accounts)
- [ ] Pull top 50 artists
- [ ] Update `artist_preferences` in Supabase

**Workflow 3: Concert Discovery** (Daily 10am)
- [ ] Cron trigger
- [ ] Read `artist_preferences`
- [ ] Query Songkick + Bandsintown
- [ ] Filter by distance & date
- [ ] Dedupe and add to Supabase
- [ ] Notify via WhatsApp if new

**Workflow 4: Event Discovery** (Daily 2pm)
- [ ] Cron trigger
- [ ] Scrape Eventbrite, Mommy Poppins, Oakland Parks
- [ ] Filter family-friendly, age 3-5
- [ ] Add to Supabase
- [ ] Notify if ticketed/high-priority

**Workflow 5: Feedback Collection** (Monday 8pm PST)
- [ ] Cron trigger
- [ ] Check for unrated weekend visits
- [ ] Send WhatsApp request
- [ ] Parse response
- [ ] Update `visits` table

**Workflow 6: Ticket Reminders** (Daily 6pm)
- [ ] Cron trigger
- [ ] Query events < 2 weeks out
- [ ] Filter unpurchased tickets
- [ ] Send WhatsApp reminder

### 3.5 WhatsApp Bot Conversation Handler
- [ ] n8n webhook for all messages
- [ ] Route to Orchestrator agent
- [ ] Support queries, details, logging
- [ ] Handle multi-turn conversations

### 3.6 Testing & Debugging
- [ ] Test all 6 workflows
- [ ] Test WhatsApp conversation flow
- [ ] Test Spotify sync & concert discovery
- [ ] Verify calendar integration
- [ ] Test feedback collection loop

---

## Phase 4: Refinement & Polish (Week 4)

### 4.1 Add Missing Logistics
- [ ] Opening hours checking
- [ ] Reservation requirement flagging
- [ ] Age-specific preference tracking
- [ ] Travel time buffers in chains
- [ ] Weather-dependent filtering
- [ ] Indoor backup suggestions

### 4.2 Preference Learning
- [ ] Track declined suggestions
- [ ] Analyze rating patterns per child
- [ ] Identify standby rotation cadence
- [ ] Seasonal pattern detection
- [ ] Social graph learning

### 4.3 Concert Feature Enhancements
- [ ] Venue quality scoring
- [ ] Date proximity weighting
- [ ] Artist listen recency
- [ ] Price range filtering

### 4.4 Subagent Prompt Tuning
- [ ] Refine system prompts
- [ ] Add suggestion examples
- [ ] Test edge cases
- [ ] Tune for family voice

### 4.5 Documentation
- [ ] Complete SETUP.md
- [ ] API-KEYS.md guide
- [ ] ARCHITECTURE.md overview
- [ ] SUBAGENTS.md design docs
- [ ] WHATSAPP-SETUP.md guide
- [ ] Troubleshooting guide
- [ ] Maintenance notes

### 4.6 Wife Onboarding
- [ ] Set up WhatsApp access
- [ ] Connect Spotify account
- [ ] Test her usage
- [ ] Gather feedback
- [ ] Create user guide

---

## Success Metrics

**System is working when:**
- ✅ Thursday noon: 3 personalized weekend suggestions via WhatsApp
- ✅ Concert alerts based on Spotify listening
- ✅ Calendar-aware (no conflict suggestions)
- ✅ Weather-smart (rain backups, sunny day optimization)
- ✅ Dietary-safe restaurants only
- ✅ Suggestions improve week over week
- ✅ Wife uses it easily via WhatsApp

---

## Future Enhancements (v2/v3)

### v2 (Fast-Follow)
- Web dashboard
- iMessage bot integration
- Advanced social graph
- Map visualizations
- Photo memories

### v3 (Nice-to-Have)
- Birthday party planning mode
- Travel planning agent
- Membership ROI analysis
- Parking data integration

---

## Budget

**Monthly Operating Costs:**
- Supabase: $0 (free tier)
- WhatsApp API: $0 (Meta free tier)
- Anthropic API: $5-10 (pay-as-you-go)
- All other APIs: $0 (free tiers)

**Total: ~$5-10/month**

---

*This is the master plan. See PROGRESS.md for current status.*
