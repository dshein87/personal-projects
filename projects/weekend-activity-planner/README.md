# Weekend Activity Planner

**AI-powered family activity planning for Oakland weekends with kids ages 3 & 5**

---

## Overview

An intelligent multi-agent system that:
- 🎯 Provides weekly personalized weekend activity suggestions
- 🎵 Discovers concerts based on Spotify listening history
- 📅 Integrates with Google Calendar to avoid conflicts
- 🌤️ Makes weather-aware recommendations
- 🍽️ Suggests dietary-safe restaurants (celiac, allergen-aware)
- 🔗 Plans multi-activity day chains with logistics
- 📊 Learns from feedback to improve suggestions over time
- 💬 Accessible via WhatsApp bot interface

---

## Quick Start

### For Resuming Development

**Read this first:** `building/README.md`

Then check:
1. `building/PROGRESS.md` - What's done
2. `building/ISSUES.md` - Any blockers
3. `building/session-logs/[latest].md` - Last session context

### For First-Time Setup

1. **Copy environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in API keys in `.env`:**
   - See `building/API-REFERENCE.md` for where to get each key
   - Follow `building/ENVIRONMENT-CHECKLIST.md` to verify setup

3. **Set up Supabase:**
   - Create project at supabase.com
   - Run `database/schema.sql`
   - Load seed data from `database/seed-*.sql`

4. **Install MCP servers:**
   ```bash
   cd mcp-servers/orchestrator && npm install
   cd ../activity-planner && npm install
   cd ../music-scout && npm install
   cd ../food-finder && npm install
   cd ../schedule-sync && npm install
   ```

5. **Set up n8n workflows:**
   - Import from `n8n-workflows/`
   - Configure credentials
   - Enable cron triggers

6. **Run rating UI:**
   ```bash
   cd rating-ui
   pip install -r requirements.txt
   streamlit run streamlit_app.py
   ```

---

## Architecture

### Tech Stack
- **Database**: Supabase (PostgreSQL, free tier)
- **Agents**: 5 MCP servers (TypeScript)
- **Automation**: n8n workflows
- **Messaging**: WhatsApp Cloud API
- **Rating UI**: Streamlit (Python)

### Agent Architecture

```
Orchestrator (main coordinator)
├── Music Scout (concert discovery via Spotify)
├── Activity Planner (kid activities, parks, museums)
├── Food Finder (restaurants with dietary restrictions)
└── Schedule Sync (calendar, weather, logistics)
```

**Communication:** Direct tool calling (Option B) for real-time agent coordination

---

## Features

### v1 (Current)

- ✅ Weekly activity suggestions (Thursday noon)
- ✅ Concert discovery from Spotify
- ✅ Calendar integration (Google Calendar)
- ✅ Weather-aware planning
- ✅ Dietary-safe restaurants
- ✅ Multi-activity chaining
- ✅ Feedback learning loop
- ✅ WhatsApp bot interface
- ✅ Special occasion tracking

### v2 (Planned)

- Web dashboard for wife
- iMessage integration
- Advanced social graph
- Map visualizations
- Photo memories

See `building/BACKLOG.md` for full feature list.

---

## Project Structure

```
weekend-activity-planner/
├── building/              # Session tracking & documentation
│   ├── README.md          # Session resume guide
│   ├── PLAN.md            # Master implementation plan
│   ├── PROGRESS.md        # Progress tracker
│   ├── DECISIONS.md       # Architectural decisions
│   ├── ISSUES.md          # Problem tracking
│   ├── TESTING.md         # Test guide
│   └── session-logs/      # Timestamped session notes
├── .claude/               # Claude Code project context
│   └── CLAUDE.md          # Project-specific context
├── database/              # Supabase schema & seeds
│   ├── schema.sql         # Database structure
│   ├── seed-activities.sql # ~75 Oakland activities
│   └── seed-restaurants.sql # ~25 restaurants
├── mcp-servers/           # 5 specialized agents
│   ├── orchestrator/      # Main coordinator
│   ├── music-scout/       # Concert discovery
│   ├── activity-planner/  # Kid activities
│   ├── food-finder/       # Restaurants
│   └── schedule-sync/     # Calendar & logistics
├── n8n-workflows/         # 6 automation workflows
├── rating-ui/             # Streamlit rating interface
├── docs/                  # Setup & API guides
├── .env.example           # Environment template
└── .gitignore             # Security patterns
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| **building/README.md** | How to resume development |
| **building/PLAN.md** | Complete implementation plan |
| **building/TESTING.md** | How to test components |
| **building/API-REFERENCE.md** | API docs and links |
| **building/DECISIONS.md** | Why we built it this way |
| **docs/SETUP.md** | Full setup guide |
| **docs/ARCHITECTURE.md** | System architecture |

---

## Development

### Testing MCP Servers

```bash
cd mcp-servers/orchestrator
npm run build
claude code  # Test via Claude Code CLI
```

### Testing n8n Workflows

1. Open workflow in n8n editor
2. Click "Execute Workflow" manually
3. Check logs for errors
4. Verify WhatsApp messages sent

### Running Rating UI

```bash
cd rating-ui
streamlit run streamlit_app.py
```

See `building/TESTING.md` for comprehensive testing guide.

---

## Environment Variables

Required API keys (see `.env.example`):
- `ANTHROPIC_API_KEY` - Claude AI
- `SUPABASE_URL` and `SUPABASE_KEY` - Database
- `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` - Music
- `WHATSAPP_API_TOKEN` - Messaging
- `GOOGLE_CALENDAR_*` - Calendar integration
- Weather & concert API keys

See `building/ENVIRONMENT-CHECKLIST.md` to verify setup.

---

## Cost

**Monthly operating cost:** ~$5-10

- Supabase: $0 (free tier)
- WhatsApp: $0 (Meta free tier, 1k conversations)
- Anthropic API: $5-10 (pay-as-you-go)
- All other APIs: $0 (free tiers)

---

## Timeline

- **Week 1**: Foundation (database, seed data, rating UI)
- **Week 2**: MCP servers (5 agents)
- **Week 3**: Automation (WhatsApp + n8n)
- **Week 4**: Polish & documentation

See `building/PROGRESS.md` for current status.

---

## Key Decisions

- **Supabase over Google Sheets**: Better learning, proper database
- **Multi-agent architecture**: Easier maintenance, better learning
- **Direct tool calling**: Cleaner agent communication
- **WhatsApp bot first**: Wife will actually use it
- **Spotify integration**: Auto-learn concert preferences

See `building/DECISIONS.md` for full rationale.

---

## Security

⚠️ **IMPORTANT**: Never commit `.env` or any files with API keys!

- All secrets in `.env` (gitignored)
- Service role keys server-side only
- API key rotation if exposed
- Separate dev/prod credentials

---

## Support

- **Issues**: Check `building/ISSUES.md`
- **Testing**: See `building/TESTING.md`
- **Setup**: Read `docs/SETUP.md`
- **API Help**: Check `building/API-REFERENCE.md`

---

## Contributing

This is a personal family project, but the patterns are reusable:
- Multi-agent MCP architecture
- Spotify integration for events
- WhatsApp bot interface
- n8n automation workflows
- Supabase for rapid prototyping

Feel free to adapt the architecture for your own projects!

---

**Built with:** Claude Code, Supabase, n8n, TypeScript, Python
**For:** Weekend family planning in Oakland, CA
**Status:** 🚧 In Development (Phase 1)
