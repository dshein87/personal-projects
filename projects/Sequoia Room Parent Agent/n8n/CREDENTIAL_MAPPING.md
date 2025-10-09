# n8n Credential Mapping Guide

## Problem
When you upload the workflow JSON, n8n doesn't automatically match credentials by name. The workflow references credentials by **ID**, not name, so each upload requires manual reconnection.

## Current Workflow Credential IDs

The workflow `handoff/workflow_export_ready_fixed.json` currently references these credential IDs:

| Service | Credential ID in JSON | Expected Credential Name |
|---------|----------------------|-------------------------|
| Gmail | `bmxgWt0gSJhngHjY` | `gmail-rpu` |
| Google Sheets | `opmsUZ0EOPU1PD9R` | `gsheets-rpu` |
| Google Drive | `3Mlbk1EdQh6pn35w` | `gdrive-rpu` |
| Google Calendar | `y75XdoGS3DwHvZi1` | `gcal-rpu` |
| Google Gemini (PaLM) | `1KSrJ3dYH94nVSPY` | `gemini-rpu` |

## Solution: Update Credential IDs Before Upload

### Step 1: Get Your Credential IDs from n8n

1. In n8n UI, go to **Settings** → **Credentials**
2. Click on each credential (gmail-rpu, gsheets-rpu, etc.)
3. Look at the URL - the credential ID is at the end:
   ```
   https://dshein.app.n8n.cloud/credentials/YOUR_CREDENTIAL_ID
   ```
4. Record each ID

### Step 2: Update the Workflow JSON

Use the helper script `scripts/update_credentials.sh` to automatically update all credential IDs:

```bash
cd "/Users/dshein/Personal Projects/projects/Sequoia Room Parent Agent"
./scripts/update_credentials.sh
```

Or manually edit `handoff/workflow_export_ready_fixed.json` and replace:
- Old Gmail ID → Your `gmail-rpu` ID
- Old Sheets ID → Your `gsheets-rpu` ID
- Old Drive ID → Your `gdrive-rpu` ID
- Old Calendar ID → Your `gcal-rpu` ID
- Old Gemini ID → Your `gemini-rpu` ID

### Step 3: Upload the Updated Workflow

The workflow will now automatically use the correct credentials without manual reconnection.

## Quick Find & Replace

If you know your credential IDs, you can use this command:

```bash
# Example (replace with your actual IDs):
sed -i.bak \
  -e 's/"bmxgWt0gSJhngHjY"/YOUR_GMAIL_ID/g' \
  -e 's/"opmsUZ0EOPU1PD9R"/YOUR_SHEETS_ID/g' \
  -e 's/"3Mlbk1EdQh6pn35w"/YOUR_DRIVE_ID/g' \
  -e 's/"y75XdoGS3DwHvZi1"/YOUR_CALENDAR_ID/g' \
  -e 's/"1KSrJ3dYH94nVSPY"/YOUR_GEMINI_ID/g' \
  handoff/workflow_export_ready_fixed.json
```

## Nodes Using Each Credential

### Gmail (`bmxgWt0gSJhngHjY`)
- Gmail Search
- Send Daily Digest Email
- Send Weekly Digest Email
- Notify Success Email

### Google Sheets (`opmsUZ0EOPU1PD9R`)
- Allergy Rows
- Snack Week Schedule
- OpsLog Snapshot
- Admin Queue Snapshot
- Admin Queue Append
- Admin Queue Update
- Apply Snack Update
- Admin Queue Mark Processed
- OpsLog Append
- Admin WhatsApp Draft Upsert

### Google Drive (`3Mlbk1EdQh6pn35w`)
- Drive PDF List
- Drive Download

### Google Calendar (`y75XdoGS3DwHvZi1`)
- Calendar Snapshot
- Apply Calendar Update
- Apply Calendar Create
- Apply Calendar Cancel

### Google Gemini (`1KSrJ3dYH94nVSPY`)
- Google Gemini Chat Model

---

**Last Updated**: 2025-10-05
