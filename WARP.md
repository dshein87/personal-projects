# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

Multi-project mono-repo containing personal development projects. Each project lives under `projects/` with its own README and documentation.

### Active Projects

**weekend-activity-planner** - AI-powered family activity planning system
- Multi-agent architecture: 5 MCP servers (TypeScript) coordinated via direct tool calling
- Tech stack: Supabase (PostgreSQL), n8n workflows, WhatsApp Cloud API, Streamlit
- Location: `projects/weekend-activity-planner/`
- Session context: Always read `building/PROGRESS.md` and `building/session-logs/[latest].md` before starting work

**Sequoia Room Parent Agent** - HITL agent for classroom communications
- Extracts structured updates from Gmail/Drive using Gemini
- Scheduling via n8n (2-hour intervals 08:00–20:00 PT)
- Prompts in `/prompts/` directory for tone/format adjustments
- Location: `projects/Sequoia Room Parent Agent/`

## Common Development Commands

### Weekend Activity Planner

```bash
# Build all MCP servers
for dir in projects/weekend-activity-planner/mcp-servers/*; do
  cd "$dir" && npm install && npm run build && cd -
done

# Build individual MCP server
cd projects/weekend-activity-planner/mcp-servers/orchestrator && npm install && npm run build

# Run rating UI (Streamlit)
cd projects/weekend-activity-planner/rating-ui
source .venv/bin/activate
streamlit run streamlit_app.py

# Test Supabase connection
cd projects/weekend-activity-planner/rating-ui
python3 -c "from supabase import create_client; import os; from dotenv import load_dotenv; load_dotenv('../.env'); print('Connected!' if create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_ANON_KEY')) else 'Failed')"
```

### Sequoia Room Parent Agent

```bash
cd "projects/Sequoia Room Parent Agent"
npm install
npm start
```

## Architecture Patterns

### MCP Server Structure (weekend-activity-planner)
```
Orchestrator (main coordinator)
├── Music Scout (concert discovery via Spotify)
├── Activity Planner (kid activities, parks, museums)  
├── Food Finder (restaurants with dietary restrictions)
└── Schedule Sync (calendar, weather, logistics)
```

Communication: Direct tool calling between servers (not message queue).

### n8n Integration

**Use n8n REST API directly** - Do NOT use mcp-n8n-builder MCP server (has validation bugs).

```bash
# Example: Create workflow via API
curl -X POST "https://dshein.app.n8n.cloud/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Workflow", "nodes": [...], "connections": {}, "settings": {"executionOrder": "v1"}}'
```

Do NOT include `active` field in POST requests (read-only field).

### Database Queries (Supabase)

Always filter restaurants by dietary restrictions:
```sql
SELECT * FROM restaurants
WHERE celiac_safe = true
  AND sesame_free_options = true
  AND cashew_free_options = true
  AND flax_free_options = true
```

Use separate rating columns for children: `rating_3yo`, `rating_5yo`.

## Project-Specific Context

For detailed context on weekend-activity-planner, read:
- `projects/weekend-activity-planner/.claude/CLAUDE.md` - Full project context
- `projects/weekend-activity-planner/building/DECISIONS.md` - Architecture decisions
- `projects/weekend-activity-planner/building/API-REFERENCE.md` - API documentation links

## Environment

- All secrets in `.env` files (gitignored)
- Templates provided in `.env.example`
- AWS authentication: `aws sso login --profile ai-privileged`
