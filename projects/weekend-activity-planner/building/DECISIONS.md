# Architectural Decision Log

**Purpose:** Track key decisions made during the build to provide context for future changes.

---

## 2025-10-09: Chose Supabase over Google Sheets

**Context:** Need database for activities, restaurants, visits, and preferences

**Decision:** Supabase (PostgreSQL, cloud-hosted free tier)

**Reasoning:**
- Better learning experience (real SQL vs spreadsheet formulas)
- Scales better (hundreds of activities, thousands of visits)
- Built-in auth for future web interface
- Auto-generated API (PostgREST)
- Real-time subscriptions
- Proper relational design
- Free tier is generous (500MB, 50k users)

**Alternatives considered:**
- Google Sheets (easy, familiar, works with n8n)
- Airtable (nice UI, shareable)
- Notion (collaborative)
- SQLite + cloud sync (more complex)

**Trade-offs:**
- Pro: Teaches transferable database skills
- Pro: Proper multi-table relations
- Con: Slightly more setup than Sheets
- Con: Requires learning SQL (but that's valuable)

---

## 2025-10-09: Multi-Agent Architecture with Specialized Subagents

**Context:** How to structure the AI system

**Decision:** 5 specialized MCP servers (Orchestrator + Music Scout + Activity Planner + Food Finder + Schedule Sync)

**Reasoning:**
- **Isolation**: Debugging is easier (concert issues? → check Music Scout)
- **Maintainability**: Each agent has focused responsibility
- **Scalability**: Easy to add new agents later (travel, birthday parties)
- **Context efficiency**: Each subagent only loads relevant data
- **Learning value**: Multi-agent systems are the future of AI apps

**Alternatives considered:**
- Single monolithic agent (simpler but harder to maintain)
- Database as message bus (more complex, less real-time)

**Trade-offs:**
- Pro: Clean separation of concerns
- Pro: Easier prompt tuning per domain
- Pro: Can test/iterate on each independently
- Con: More initial setup
- Con: Need orchestration logic

---

## 2025-10-09: Direct Tool Calling (Option B) for Agent Communication

**Context:** How should agents communicate with each other?

**Decision:** Orchestrator has direct access to subagent tools (Option B)

**Reasoning:**
- Cleaner than database message bus
- Real-time (no polling)
- Better developer experience
- Natural fit for MCP architecture

**Alternatives considered:**
- Option A: Database as message bus (agents poll tables)

**Trade-offs:**
- Pro: Simpler implementation
- Pro: Real-time responses
- Pro: Less code to maintain
- Con: Tighter coupling (but acceptable for this use case)

---

## 2025-10-09: WhatsApp Bot as Primary Interface (not Web UI for v1)

**Context:** How should family access the system?

**Decision:** WhatsApp bot as primary interface for v1

**Reasoning:**
- **Zero friction**: Already use WhatsApp daily
- **Shared access**: Family group chat = both can use
- **Natural interaction**: Text like asking a friend
- **No app to install**: Lower adoption barrier
- **Native notifications**: Built-in, no custom push setup
- **Async conversation**: Can refine ideas over multiple messages

**Alternatives considered:**
- Web dashboard (more visual but requires opening app)
- iMessage bot (Apple-only, harder to set up)
- CLI only (too technical for wife)

**Trade-offs:**
- Pro: Wife will actually use it
- Pro: Fits existing communication patterns
- Pro: Works on all devices
- Con: No rich visualizations (but v2 can add web)
- Con: Requires WhatsApp Business API setup

---

## 2025-10-09: Spotify Integration for Concert Discovery

**Context:** How to track concert artists instead of manual list?

**Decision:** Integrate Spotify API to pull top artists from listening history

**Reasoning:**
- **Automatic learning**: Taste evolves, Spotify captures it
- **Discovery**: Finds concerts for artists currently being played
- **No maintenance**: No manual list to keep updated
- **Surprise factor**: "Artist you've been jamming to is coming!"

**Alternatives considered:**
- Manual artist list (goes stale)
- Last.fm integration (fewer users)
- Apple Music (less robust API)

**Trade-offs:**
- Pro: Always current with listening habits
- Pro: Zero maintenance
- Pro: Delightful surprise moments
- Con: Requires OAuth setup (but one-time)
- Con: Requires Spotify accounts (both have them)

---

## 2025-10-09: Meta WhatsApp Cloud API over Twilio

**Context:** Which WhatsApp API provider?

**Decision:** Start with Meta WhatsApp Cloud API (free tier)

**Reasoning:**
- **Actually free**: 1,000 conversations/month (plenty)
- **Official**: Won't risk account bans
- **Native n8n integration**: Built-in node
- **No monthly fees**: Important for personal project

**Alternatives considered:**
- Twilio ($5-10/month, faster setup)
- Unofficial (free but risky, against ToS)

**Trade-offs:**
- Pro: $0/month cost
- Pro: Official, stable
- Con: Business verification takes 2-7 days (vs Twilio's 1 hour)

**Fallback plan:** If Meta verification is slow, can spin up Twilio and migrate later

---

## 2025-10-09: Separate Ratings for 3yo and 5yo

**Context:** How to track kid enjoyment?

**Decision:** Separate rating fields for each child

**Reasoning:**
- **Different preferences**: 3yo and 5yo have different interests
- **Age-appropriate suggestions**: Can filter by what each age enjoyed
- **Learning over time**: As 3yo grows, see what transitions well
- **Sibling dynamics**: Sometimes one loves it, other doesn't

**Alternatives considered:**
- Single "kids enjoyed" rating (loses granularity)
- Free-form notes only (harder to query)

**Trade-offs:**
- Pro: Better suggestion targeting
- Pro: Can plan for individual kid needs
- Con: Slightly more input during rating (but worth it)

---

## 2025-10-09: Local Streamlit Rating UI (not CLI forms)

**Context:** How to bootstrap activity ratings efficiently?

**Decision:** Build Streamlit web UI for rating activities

**Reasoning:**
- **Better UX**: Visual interface vs CLI back-and-forth
- **Faster workflow**: Keyboard shortcuts, clear progress
- **Can show context**: Images, maps, details
- **Shareable**: Wife can rate too
- **Local-first**: SQLite → push to Supabase when ready

**Alternatives considered:**
- CLI forms (slower, worse UX)
- Direct Supabase editing (no validation, error-prone)
- Google Forms (disconnected from system)

**Trade-offs:**
- Pro: Fast rating workflow
- Pro: Better data quality
- Pro: Can be reused for ongoing ratings
- Con: ~1-2 hours to build (but worth it)

---

## 2025-10-09: Drive Time Exponential Decay Past 30 Minutes

**Context:** How to weight activities by distance?

**Decision:** Exponential decay on suggestions once drive time exceeds 30 minutes

**Reasoning:**
- **Realistic**: With young kids, long drives need special justification
- **Quality threshold**: Beyond 30 min, activity must be significantly better
- **Prevents over-optimization**: Won't suggest mediocre far activities

**Implementation:**
- 0-30 min: Normal weighting
- 30-60 min: Require higher rating / novelty
- 60-90 min: Only suggest for exceptional experiences

**Trade-offs:**
- Pro: Keeps weekends manageable
- Pro: Aligns with family energy levels
- Con: Might miss good far-away options (but that's intentional)

---

*Add new decisions as they're made during the build.*
