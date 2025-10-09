# Configuration Setup Guide

## Overview

This project uses environment variables to keep sensitive information (emails, Google Drive/Sheets IDs, etc.) out of version control. This guide explains how to set up your local environment.

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your actual values:**
   ```bash
   # Use your preferred editor
   nano .env
   # or
   code .env
   ```

3. **Configure the workflow in n8n:**
   - Import the workflow JSON from `handoff/workflow_export_ready_fixed.json`
   - Find and replace all placeholders with your actual values:
     - `NOTIFICATION_EMAIL_PLACEHOLDER` → your email address
     - `GOOGLE_SHEET_ID_PLACEHOLDER` → your Google Sheets ID
     - `GOOGLE_DRIVE_FOLDER_ID_PLACEHOLDER` → your Google Drive folder ID

## Environment Variables Reference

### NOTIFICATION_EMAIL
**Purpose:** Email address for receiving daily and weekly digests

**How to find:** This is your personal email where you want notifications sent

**Used in:** Daily/Weekly digest email nodes

---

### GOOGLE_SHEET_ID
**Purpose:** ID of the Google Sheet used for tracking snacks, allergies, and events

**How to find:**
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/edit`
3. Copy the `{SHEET_ID}` part

**Example URL:**
```
https://docs.google.com/spreadsheets/d/1A-z6pGIFbGWJUlyP4UxgTdGVXNvmZlFsg3QsIxTR3QE/edit
                                        ↑_____________SHEET_ID_____________↑
```

**Used in:** Google Sheets nodes for reading/writing calendar, snack, and allergy data

---

### GOOGLE_DRIVE_FOLDER_ID
**Purpose:** ID of the Google Drive folder containing class newsletters (PDFs)

**How to find:**
1. Open your Google Drive folder
2. Look at the URL: `https://drive.google.com/drive/folders/{FOLDER_ID}`
3. Copy the `{FOLDER_ID}` part

**Example URL:**
```
https://drive.google.com/drive/folders/1OBL_4GuvnBVmwVOOD5cmAHM4wqxwztoq
                                        ↑________FOLDER_ID_________↑
```

**Used in:** Drive search query for finding new PDF newsletters

---

### School Email Addresses
**Purpose:** Filter criteria for finding class communications in Gmail

**Variables:**
- `SCHOOL_COMM_EMAIL_1` - Primary school communications address
- `SCHOOL_COMM_EMAIL_2` - Teacher email address
- `PARENT_LIST_EMAIL` - Parent distribution list

**How to find:** Check the "From:" addresses in your class newsletters

**Used in:** Gmail search query construction

---

## Deployment Workflow

### Option 1: Manual Replacement (Recommended for n8n Cloud)

1. Open the workflow JSON file: `handoff/workflow_export_ready_fixed.json`
2. Do a global find/replace for each placeholder:
   ```
   NOTIFICATION_EMAIL_PLACEHOLDER         → david.shein@gmail.com
   GOOGLE_SHEET_ID_PLACEHOLDER            → 1A-z6pGIFbGWJUlyP4UxgTdGVXNvmZlFsg3QsIxTR3QE
   GOOGLE_DRIVE_FOLDER_ID_PLACEHOLDER     → 1OBL_4GuvnBVmwVOOD5cmAHM4wqxwztoq
   ```
3. Import the modified workflow into n8n via the UI

### Option 2: n8n Environment Variables (For Self-Hosted)

If you're running n8n self-hosted, you can use n8n's environment variable system:

1. Add variables to your n8n `.env` file:
   ```bash
   NOTIFICATION_EMAIL=david.shein@gmail.com
   GOOGLE_SHEET_ID=1A-z6pGIFbGWJUlyP4UxgTdGVXNvmZlFsg3QsIxTR3QE
   GOOGLE_DRIVE_FOLDER_ID=1OBL_4GuvnBVmwVOOD5cmAHM4wqxwztoq
   ```

2. In the workflow, use n8n expression syntax:
   ```javascript
   const email = '{{ $env.NOTIFICATION_EMAIL }}';
   const sheetId = '{{ $env.GOOGLE_SHEET_ID }}';
   ```

3. Import the workflow with environment variable references

---

## Security Best Practices

### ✅ DO:
- Keep `.env` file gitignored (already configured)
- Use `.env.example` as the template to share
- Rotate secrets if they are ever accidentally committed
- Use environment variables for all sensitive data
- Review diffs before pushing to GitHub

### ❌ DON'T:
- Commit `.env` file to git
- Share Google Drive/Sheets IDs in public repositories
- Include personal email addresses in version-controlled files
- Hardcode credentials or API keys

---

## File Structure

```
projects/Sequoia Room Parent Agent/
├── .env                  # Your actual secrets (gitignored, not committed)
├── .env.example          # Template with placeholders (committed)
├── CONFIG_SETUP.md       # This file (committed)
├── handoff/
│   └── workflow_export_ready_fixed.json  # Sanitized workflow (placeholders)
└── ...
```

---

## Troubleshooting

### "Workflow won't execute properly"
- **Cause:** Placeholders not replaced with actual values
- **Fix:** Search workflow JSON for `_PLACEHOLDER` and replace with real values

### "Google Sheets node failing"
- **Cause:** Wrong Sheet ID or missing permissions
- **Fix:**
  1. Verify Sheet ID matches your actual Google Sheet
  2. Ensure n8n has OAuth access to your Google account
  3. Check sheet permissions (must be accessible by your Google account)

### "Drive download failing"
- **Cause:** Wrong folder ID or permissions issue
- **Fix:**
  1. Verify folder ID from Drive URL
  2. Ensure folder is shared with your Google account
  3. Check if folder is in a Shared Drive (may need admin permissions)

---

## Getting Help

If you encounter issues:
1. Check n8n execution logs for specific error messages
2. Verify all placeholders have been replaced
3. Confirm Google OAuth credentials are properly configured
4. Review n8n documentation: https://docs.n8n.io

---

## Changelog

- **2025-10-09:** Initial configuration system setup with environment variables
- Sanitized workflow files to remove PII and sensitive IDs
- Created `.env.example` template
