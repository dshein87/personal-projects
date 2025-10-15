# n8n Workflow Quick Reference Card

**Workflow:** Weekly Activity Suggestions
**ID:** `wRRp1fTwNzOHr9rY`
**Status:** Ready to Deploy

---

## Deploy Workflow (Choose One)

### Option 1: Automated Script (Recommended)
```bash
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner"
./scripts/deploy-workflow.sh
```

### Option 2: Manual curl
```bash
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner"
source .env

curl -X PUT "https://dshein.app.n8n.cloud/api/v1/workflows/wRRp1fTwNzOHr9rY" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @building/workflow-payload.json | python3 -m json.tool
```

### Option 3: GUI Copy-Paste
1. Open: https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY
2. Follow step-by-step in `N8N-WORKFLOW-SPECIFICATION.md` (Implementation Steps section)

---

## Verify Deployment

```bash
# Check workflow exists and get details
source .env
curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  "https://dshein.app.n8n.cloud/api/v1/workflows/wRRp1fTwNzOHr9rY" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Name: {d['name']}\nNodes: {len(d['nodes'])}\nActive: {d['active']}\")"
```

---

## Test Workflow

### In n8n GUI
1. Open: https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY
2. Replace "Schedule Trigger" with "Manual Trigger" (for testing)
3. Click "Execute Workflow"
4. Check each node's output
5. Verify final message format

### Expected Output
- 3 activities with scores 0.6-0.9
- Each activity has: name, city, drive time, rating, description
- 0-2 restaurants per activity
- WhatsApp-formatted message (markdown)

---

## Activate Workflow

### Via GUI
1. Restore "Schedule Trigger" (cron: `0 12 * * 4`)
2. Click "Active" toggle (top-right)
3. Verify green "Active" indicator

### Via API
```bash
source .env
curl -X POST "https://dshein.app.n8n.cloud/api/v1/workflows/wRRp1fTwNzOHr9rY/activate" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}"
```

---

## Workflow Structure (9 Nodes)

1. **Schedule Trigger** - Thursday noon PST
2. **Query Activities** - Supabase: age 3-5 suitable
3. **Query Visit History** - Supabase: build visit map
4. **Query Restaurants** - Supabase: dietary-safe only
5. **Score Activities** - 5-component algorithm
6. **Select Top 3** - With diversity
7. **Match Restaurants** - Proximity-based (≤15 min)
8. **Format Message** - WhatsApp markdown
9. **Output Placeholder** - (Will be WhatsApp node later)

---

## Scoring Algorithm (Weights)

| Component | Weight | Logic |
|-----------|--------|-------|
| Rating | 40% | `(avg_rating / 5.0) × 0.4` |
| Drive Time | 20% | Linear ≤30min, exponential >30min |
| Novelty | 30% | Days since visit / 30 (capped) |
| Age Match | 5% | Binary: 0.05 if ages 3-5 |
| Weather | 5% | 0.05 outdoor, 0.035 both, 0.025 indoor |

---

## Environment Variables

### In n8n (Settings → Environment Variables)
```
SUPABASE_URL=https://ohdmrfyyavlkoflbbjsd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<key>
```

### In Local .env
```
N8N_API_KEY=<key>
N8N_HOST=https://dshein.app.n8n.cloud
N8N_PROJECT_ID=XoTYV1MmnDfn9HAv
```

---

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"
**Solution:** Replace Code nodes with HTTP Request nodes
```javascript
// Instead of Code node with Supabase client:
// Use HTTP Request node:
URL: https://ohdmrfyyavlkoflbbjsd.supabase.co/rest/v1/activities?age_min=lte.3&age_max=gte.5
Headers:
  - apikey: ${SUPABASE_ANON_KEY}
  - Authorization: Bearer ${SUPABASE_ANON_KEY}
```

### "process.env.SUPABASE_URL is undefined"
**Solution:** Add environment variables in n8n Settings → Environment Variables

### Data Structure Errors
**Solution:** Add `n8n-nodes-base.set` (debug) nodes to inspect data between nodes

---

## Key Files

| File | Purpose |
|------|---------|
| `building/N8N-WORKFLOW-SPECIFICATION.md` | Full 2,800-line specification |
| `building/workflow-payload.json` | Ready-to-deploy JSON |
| `scripts/deploy-workflow.sh` | Automated deployment |
| `building/WORKFLOW-IMPLEMENTATION-SUMMARY.md` | Implementation overview |
| `building/N8N-APPROACH.md` | REST API guide |

---

## Quick Links

- **Workflow:** https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY
- **Project:** https://dshein.app.n8n.cloud/projects/XoTYV1MmnDfn9HAv/workflows
- **n8n API Docs:** https://docs.n8n.io/api/
- **Supabase Dashboard:** https://supabase.com/dashboard/project/ohdmrfyyavlkoflbbjsd

---

## Success Checklist

- [ ] Environment variables set in n8n
- [ ] Workflow deployed (9 nodes)
- [ ] Tested with Manual Trigger
- [ ] All nodes execute without errors
- [ ] Output message formatted correctly
- [ ] Schedule Trigger restored (Thursday noon)
- [ ] Workflow activated
- [ ] First execution monitored

---

**Next Session Goal:** Monitor first automated execution (Thursday noon)
**Estimated Deployment Time:** 10 minutes (script) to 60 minutes (manual testing + fixes)

---

*Keep this card handy for quick reference during deployment and testing.*
