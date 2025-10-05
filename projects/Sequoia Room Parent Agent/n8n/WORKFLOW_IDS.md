# n8n Workflow IDs

## ✅ ACTIVE WORKFLOW (Use This)

**ID**: `QyJqHziW6fupaR5H`
**URL**: https://dshein.app.n8n.cloud/workflow/QyJqHziW6fupaR5H
**Name**: Room Parent Agent (WIP)
**Status**: Active workflow - use for all development and production
**Created**: 2025-09-23
**Last Updated**: 2025-10-05T04:56:29Z

---

## ❌ LEGACY WORKFLOWS (Do Not Use)

### Old Workflow #1
**ID**: `5FMGLNbKrDBKJaQe`
**Status**: Legacy/Deprecated
**Note**: Accidentally uploaded to this ID on 2025-10-05. Do not use.

---

## API Upload Command

When uploading workflow updates, always use:

```bash
curl -X PUT \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @handoff/workflow_export_ready_fixed.json \
  https://dshein.app.n8n.cloud/api/v1/workflows/QyJqHziW6fupaR5H
```

**Important**: Always verify the workflow ID is `QyJqHziW6fupaR5H` before uploading!
