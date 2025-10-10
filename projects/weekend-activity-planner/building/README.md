# How to Resume Building

**Last worked on:** 2025-10-09
**Current phase:** Phase 1 - Foundation
**Next task:** Complete building/ documentation system, then create security files

---

## Quick Start

When resuming work on this project:

1. **Read PROGRESS.md** - See what's been completed
2. **Check ISSUES.md** - Review any blockers or known problems
3. **Review session-logs/[latest].md** - Get context from last session
4. **Continue from "Next task" above**

---

## File Guide

| File | Purpose |
|------|---------|
| **PLAN.md** | Complete 4-week implementation plan (master reference) |
| **PROGRESS.md** | Living tracker of what's built and what's next |
| **DECISIONS.md** | Architectural decision log (why we chose X over Y) |
| **ISSUES.md** | Known problems, solutions, and workarounds |
| **TESTING.md** | How to test each component |
| **API-REFERENCE.md** | Quick links to all API documentation |
| **ENVIRONMENT-CHECKLIST.md** | Setup verification checklist |
| **LESSONS-LEARNED.md** | Discoveries and insights during build |
| **BACKLOG.md** | v2/v3 features for later |
| **session-logs/** | Timestamped notes from each work session |

---

## Project Overview

### What We're Building
AI-powered family activity planner for weekends with kids (ages 3 & 5) in Oakland, CA.

### Key Features
- 🗓️ Weekly personalized activity suggestions (Thursday noon)
- 🎵 Concert discovery via Spotify integration (for wife)
- 📅 Calendar-aware planning (avoid conflicts)
- 🌤️ Weather-smart suggestions
- 🍽️ Dietary-safe restaurant recommendations (celiac, sesame, cashew, flax)
- 🔗 Multi-activity day chaining
- 📊 Learning feedback loop
- 💬 WhatsApp bot interface

### Tech Stack
- **Database**: Supabase (PostgreSQL, free tier)
- **Agents**: 5 MCP servers (orchestrator + 4 specialized subagents)
- **Automation**: n8n (6 workflows)
- **Messaging**: WhatsApp Cloud API (Meta)
- **Rating UI**: Streamlit (local)

### Architecture
- **Direct tool calling** (Option B) for agent communication
- **Specialized subagents**: Music Scout, Activity Planner, Food Finder, Schedule Sync
- **Orchestrator** coordinates all subagents

---

## Loading Context for Claude Code

When starting a new session, load these files in Claude Code:

```bash
# From project root
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner"

# Core context files to read/reference:
# - building/README.md (this file)
# - building/PROGRESS.md
# - building/ISSUES.md
# - building/session-logs/[latest].md
# - .claude/CLAUDE.md (project context)
```

---

## Quick Reference

### Project Root
`/Users/dshein/Personal Projects/projects/weekend-activity-planner`

### Key Directories
- `building/` - Session tracking & resume docs
- `.claude/` - Project-specific Claude Code context
- `database/` - Supabase schema & seed data
- `mcp-servers/` - 5 MCP servers (orchestrator + 4 subagents)
- `n8n-workflows/` - 6 automation workflows
- `rating-ui/` - Streamlit rating interface
- `docs/` - Setup guides & documentation

### Environment
- All API keys in `.env` (never committed)
- Template in `.env.example`

---

## Timeline

- **Week 1**: Foundation (structure, Supabase, seed data, rating UI)
- **Week 2**: MCP servers (5 agents)
- **Week 3**: Automation (WhatsApp + n8n workflows)
- **Week 4**: Polish & documentation

---

## Support

For questions about this project structure, check:
- **Architecture**: `building/DECISIONS.md` and `docs/ARCHITECTURE.md`
- **Setup**: `docs/SETUP.md`
- **Testing**: `building/TESTING.md`
- **Issues**: `building/ISSUES.md`

---

*This documentation system ensures you can resume building at any time with full context.*
