# n8n Credentials Troubleshooting

## Why Credentials Keep Getting "Dropped"

**n8n API Limitation**: The n8n REST API cannot automatically connect credentials when uploading workflows. The API can only:
- Store credential ID references in the workflow JSON
- Upload the workflow structure

What it **cannot** do:
- Automatically select credentials from your credential library
- Establish the credential connections

## The Problem

When uploading via API, nodes show "Select Credential" dropdowns even though the workflow JSON contains valid credential IDs. This is by design in n8n - credential connections must be manually selected in the UI for security reasons.

## The Solution

### One-Time Manual Setup (Required After Each API Upload)

You must manually select each credential in the n8n UI **once** after uploading:

1. Open workflow in n8n UI
2. For each node with credential dropdown:
   - Click the "Select Credential" dropdown
   - Choose the correct credential (see table below)
3. Save the workflow in UI

### Credential Mapping Reference

Use this table when manually selecting credentials:

| Node Type | Node Names | Credential to Select |
|-----------|-----------|---------------------|
| Google Gemini Chat Model | Extract Schema from PDF, Extract Schema from Email, Format Daily Digest, Format Weekly Digest, Format WhatsApp Message | `gemini-rpu` |
| Gmail | Gmail Search | `gmail-david-sequoia` |
| Google Drive | Drive PDF Search | `gdrive-david-sequoia` |
| Google Sheets | Snack Week Schedule, Allergy Rows, Get Prev Calendar, Get Prev Snack, Queue Row, Delete From Queue | `gsheets-david-sequoia` |
| Google Calendar | Get Current Cal, Update Calendar | `gcal-david-sequoia` |

### Alternative: Export from UI, Then API Upload

If you need to preserve credentials across uploads:

1. Make your code changes locally in JSON
2. Import JSON into n8n UI
3. Manually select all credentials
4. Export from UI (credentials preserved)
5. Use that export for future API uploads

### Why This Happens

n8n credential connections work through:
- **Credential ID**: A unique identifier (e.g., `wzxYR2B7s2fkPKuZ`)
- **Credential Name**: Human-readable name (e.g., `gemini-rpu`)
- **Account Context**: Your n8n account's credential library

When uploading via API:
- ✅ Credential IDs are stored in JSON
- ❌ But the UI doesn't automatically map IDs to your credential library
- ❌ Security measure to prevent accidental credential exposure

### Current Workflow Credential IDs

These are already embedded in `handoff/workflow_export_ready_fixed.json`:

```json
{
  "wzxYR2B7s2fkPKuZ": "gemini-rpu (Google Gemini)",
  "eKMHXq5XqBz7jxrA": "gmail-david-sequoia (Gmail OAuth2)",
  "gPmBSWA9sJg2NWBt": "gdrive-david-sequoia (Google Drive OAuth2)",
  "vbQUFLQDHpGUiJ1Z": "gsheets-david-sequoia (Google Sheets OAuth2)",
  "e16YMRHhoBn3L6pj": "gcal-david-sequoia (Google Calendar OAuth2)"
}
```

## Quick Setup Checklist

After each API upload:

- [ ] Open workflow in n8n UI: https://dshein.app.n8n.cloud/workflow/QyJqHziW6fupaR5H
- [ ] Select `gemini-rpu` for: Extract Schema (PDF & Email), Format Digest (Daily & Weekly), Format WhatsApp
- [ ] Select `gmail-david-sequoia` for: Gmail Search
- [ ] Select `gdrive-david-sequoia` for: Drive PDF Search
- [ ] Select `gsheets-david-sequoia` for: All Google Sheets nodes (6 total)
- [ ] Select `gcal-david-sequoia` for: Get Current Cal, Update Calendar
- [ ] Save workflow
- [ ] Test execution

## Files to Reference

- **Credential IDs**: See `n8n/CREDENTIAL_MAPPING.md`
- **Node Names**: See `n8n/workflow_export_ready_fixed.json` → nodes array
