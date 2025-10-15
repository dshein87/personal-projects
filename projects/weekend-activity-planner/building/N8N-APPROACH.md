# n8n Integration Approach

**Status:** ✅ Validated 2025-10-15
**Approach:** Direct REST API (no MCP)

---

## 🎯 Summary

**Use n8n REST API directly** - do NOT use community MCP servers for n8n workflow management.

**Why:**
- Official n8n REST API is stable and well-documented
- Community MCPs have validation bugs (see lessons learned below)
- No official n8n MCP exists from n8n.io
- Direct API gives full control without abstraction layer bugs

---

## ✅ What Works

### 1. Creating Workflows via REST API

**Endpoint:** `POST https://dshein.app.n8n.cloud/api/v1/workflows`

**Working Example:**
```bash
curl -X POST "https://dshein.app.n8n.cloud/api/v1/workflows" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Test Schedule Trigger - Direct API",
  "nodes": [
    {
      "id": "schedule-1",
      "name": "Every Thursday Noon",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 12 * * 4"
            }
          ]
        }
      }
    },
    {
      "id": "http-1",
      "name": "HTTP Request",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [450, 300],
      "parameters": {
        "method": "GET",
        "url": "https://api.github.com/zen"
      }
    }
  ],
  "connections": {
    "Every Thursday Noon": {
      "main": [
        [
          {
            "node": "HTTP Request",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}'
```

**Response:** Returns workflow object with generated `id`, `versionId`, `createdAt`, etc.

**Verified:** 2025-10-15 - Successfully created workflow with `scheduleTrigger` node

**Project Assignment:**
- Workflows created via API default to account level
- **Solution:** Create via API, then move to project in GUI (drag & drop)
- **Verified:** Workflow `wRRp1fTwNzOHr9rY` successfully in project `XoTYV1MmnDfn9HAv`

---

### 2. Available Nodes

**Confirmed Working:**
- `n8n-nodes-base.scheduleTrigger` - Cron-based scheduling ✅
- `n8n-nodes-base.httpRequest` - HTTP calls ✅
- `n8n-nodes-base.code` - JavaScript execution ✅
- `n8n-nodes-base.function` - Data transformation ✅
- `n8n-nodes-base.if` - Conditional logic ✅
- `n8n-nodes-base.set` - Set values ✅
- `n8n-nodes-base.merge` - Merge data ✅
- `n8n-nodes-base.switch` - Multi-way branching ✅

**Note:** n8n Cloud instances have 400+ nodes available. The REST API accepts any valid node type.

---

### 3. Key Fields

**Required in every node:**
- `id` (string) - Unique identifier
- `name` (string) - Display name
- `type` (string) - Node type (e.g., `n8n-nodes-base.scheduleTrigger`)
- `position` (array) - `[x, y]` coordinates for UI

**Optional but common:**
- `typeVersion` (number) - Node version
- `parameters` (object) - Node configuration
- `credentials` (object) - Authentication config

**Workflow-level:**
- `name` (string) - Required
- `nodes` (array) - Required
- `connections` (object) - Required
- `settings` (object) - Optional
- `active` (boolean) - **Read-only, do NOT include in POST**

---

## ❌ What Doesn't Work

### 1. Community MCP: mcp-n8n-builder

**Package:** `mcp-n8n-builder` from `/spences10/mcp-n8n-builder`

**Problem:** Validation bug in `list_available_nodes`
- Returns only 8 nodes (nodes currently in workflows)
- Should return all 400+ available node types
- Incorrectly rejects valid node types like `scheduleTrigger`

**Error Example:**
```
Workflow contains invalid node types:
- 'n8n-nodes-base.scheduleTrigger': Not a valid n8n node.
Did you mean 'n8n-nodes-base.manualTrigger'?
```

**Reality:** `scheduleTrigger` IS valid (proven by direct API call)

**Root Cause:** MCP queries wrong endpoint - gets nodes from existing workflows instead of full node catalog

**Status:** Reported 2025-10-15, removed from `.mcp.json`

---

### 2. Including `active` in POST Request

**Error:**
```json
{"message":"request/body/active is read-only"}
```

**Fix:** Remove `active` field from workflow creation payload. It's set by n8n automatically.

---

## 📋 Recommended Approach for This Project

### Phase 3: Automation (Current)

**Use direct REST API calls via curl/bash scripts** for workflow management:

1. **Create workflows:** Use curl with JSON payloads
2. **Test workflows:** n8n GUI or REST API
3. **Activate workflows:** `PUT /workflows/{id}/activate`

**Benefits:**
- No buggy MCPs
- Full control
- Clear error messages
- Works with all 400+ nodes

### Phase 3 Workflow Architecture

**Option A: Simple (Recommended for v1)**
```
n8n Schedule Trigger
  → Code Node (JavaScript)
     - Query Supabase directly
     - Apply recommendation logic
     - Format for WhatsApp
  → HTTP Request
     - Send to WhatsApp API
```

**Option B: MCP Integration (v2)**
```
n8n Schedule Trigger
  → HTTP Request to deployed MCP wrapper
     - Call orchestrator MCP
     - Returns formatted suggestions
  → HTTP Request
     - Send to WhatsApp API
```

**Decision:** Use Option A for v1 (simpler, fewer moving parts)

---

## 🔧 n8n REST API Reference

### Base URL
```
https://dshein.app.n8n.cloud/api/v1
```

### Authentication
```
Header: X-N8N-API-KEY: ${N8N_API_KEY}
```

### Key Endpoints

**Workflows:**
- `GET /workflows` - List all workflows
- `POST /workflows` - Create workflow
- `GET /workflows/{id}` - Get workflow details
- `PUT /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow
- `PUT /workflows/{id}/activate` - Activate workflow
- `PUT /workflows/{id}/deactivate` - Deactivate workflow

**Executions:**
- `GET /executions` - List executions
- `GET /executions/{id}` - Get execution details

**Credentials:**
Stored in n8n (can't manage via API for security)

---

## 💡 Lessons Learned

### 1. Always Validate MCP Sources

**Before using an MCP:**
- ✅ Check if official (from product company)
- ✅ Check trust score on Context7
- ✅ Test with simple examples first
- ✅ Verify against official API docs

**This project:**
- ✅ Supabase MCP: Official from `@supabase` ✅
- ❌ n8n MCP: Community, has bugs ❌
- ✅ Context7 MCP: Official from Anthropic ✅

### 2. REST APIs > Buggy MCPs

When choosing between:
- Community MCP with abstraction bugs
- Direct REST API with clear docs

**Choose REST API** - more reliable, better error messages, full control

### 3. Test Early, Test Often

The MCP validation bug was caught because we:
1. Tested with a simple workflow first
2. Verified error messages against docs
3. Questioned the MCP's response
4. Proved it wrong with direct API call

**Always test critical integrations early!**

---

## 📚 Additional Resources

### n8n Official Docs
- **API Reference:** https://docs.n8n.io/api/
- **Node Types:** https://docs.n8n.io/integrations/builtin/
- **Workflow Examples:** https://n8n.io/workflows/

### Our Configuration
- **n8n Host:** https://dshein.app.n8n.cloud
- **API Key Location:** `.env` (`N8N_API_KEY`)
- **Workflow Storage:** n8n Cloud
- **Local Testing:** n8n GUI at https://dshein.app.n8n.cloud

---

## 🚀 Next Steps

1. ✅ Remove buggy MCP from `.mcp.json`
2. ✅ Create first working workflow via REST API
3. ✅ Add Supabase query logic with 5-component scoring algorithm
4. ⏸️ Test workflow manually in n8n GUI
5. ⏸️ Add restaurant recommendations (optional for v1)
6. ⏸️ Integrate WhatsApp messaging (when API approved)
7. ⏸️ Activate workflow for production

---

## 📊 Implemented Workflow: Weekly Activity Suggestions

**Workflow ID:** `wRRp1fTwNzOHr9rY`
**Project:** Weekly Activity Planner (`XoTYV1MmnDfn9HAv`)
**Status:** Built, ready for testing
**Schedule:** Every Thursday at 12:00 PM (cron: `0 12 * * 4`)

### Workflow Structure

```
1. Schedule Trigger (n8n-nodes-base.scheduleTrigger)
   ↓
2. Query Activities & Score (n8n-nodes-base.code)
   - Queries Supabase activities table
   - Queries visits table for novelty scoring
   - Applies 5-component algorithm:
     * Rating: 40% weight
     * Drive time: 20% weight (exponential decay >30 min)
     * Novelty: 30% weight (days since last visit)
     * Age match: 5% weight (ages 3-5)
     * Weather: 5% weight (outdoor preference)
   - Returns top 3 activities
   ↓
3. Output Message (n8n-nodes-base.set)
   - Formats WhatsApp-ready message
   - Includes: name, city, drive time, rating, description
```

### Scoring Algorithm Details

```javascript
// 1. Rating score (40%)
ratingScore = (avg_rating / 5.0) * 0.4

// 2. Drive time score (20%)
if (drive_time <= 30 min):
  driveScore = (30 - drive_time) / 30 * 0.2
else:
  driveScore = exp(-(drive_time - 30) / 20) * 0.2

// 3. Novelty score (30%)
daysSince = days since last visit (or 999 if never)
noveltyScore = min(daysSince / 30, 1.0) * 0.3

// 4. Age match (5%)
ageMatchScore = (age_min <= 3 AND age_max >= 5) ? 0.05 : 0

// 5. Weather score (5%)
weatherScore = outdoor ? 0.05 : 0.025
```

### Example Output

```
🎉 *Weekend Activity Suggestions* 🎉

Here are your top 3 activities for this weekend:

1. *Frog Park* (Oakland)
   📍 8 min drive
   ⭐ 4.8/5
   Large playground with bike paths and weekly farmers market

2. *Lawrence Hall of Science* (Berkeley)
   📍 25 min drive
   ⭐ 4.6/5
   Interactive science museum with hands-on exhibits

3. *Adventure Playground* (Berkeley)
   📍 22 min drive
   ⭐ 4.7/5
   Creative messy play with building materials and art

Have a great weekend! 🌟
```

---

**Last Updated:** 2025-10-15
**Status:** Workflow logic complete, ready for testing
**Approach Validated:** ✅ Working
