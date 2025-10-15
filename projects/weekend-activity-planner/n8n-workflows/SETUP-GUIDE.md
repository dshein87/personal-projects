# n8n Setup Guide - Weekend Activity Planner

**Status:** Phase 3 - Automation & Integration
**Goal:** Connect Claude Code to n8n Cloud via MCP for programmatic workflow creation

---

## Overview

We're using the `mcp-n8n-builder` MCP server to build n8n workflows programmatically. This allows Claude Code to create and manage workflows via the n8n REST API, with all credentials stored securely in `.env`.

**Architecture:**
```
Claude Code → MCP n8n Builder → n8n Cloud REST API → Workflows Created
```

---

## Step 1: Get Your n8n Cloud Credentials (5 minutes)

### 1.1 Find Your n8n Cloud Instance URL

1. Go to https://app.n8n.cloud
2. Login to your n8n account
3. Your instance URL is at the top of the page
   - Example: `https://weekend-planner.app.n8n.cloud`
4. **Add `/api/v1` to the end** for the API endpoint
   - Example: `https://weekend-planner.app.n8n.cloud/api/v1`

### 1.2 Generate an API Key

1. In n8n Cloud, click your profile (bottom left)
2. Click **"Settings"**
3. Go to **"API"** tab
4. Click **"Create an API key"**
5. Give it a name: `Claude Code MCP Builder`
6. Copy the API key (starts with `n8n_api_`)
   - ⚠️ **Save this immediately** - you can't see it again!

---

## Step 2: Add Credentials to .env (2 minutes)

1. **Copy `.env.example` to `.env`** (if you haven't already):
   ```bash
   cp .env.example .env
   ```

2. **Open `.env` in your editor**

3. **Find the n8n section** (around line 77) and fill in your values:
   ```bash
   # n8n Cloud (recommended)
   N8N_HOST=https://YOUR-INSTANCE.app.n8n.cloud/api/v1
   N8N_API_KEY=n8n_api_YOUR_ACTUAL_API_KEY_HERE
   ```

4. **Example with real values:**
   ```bash
   N8N_HOST=https://weekend-planner.app.n8n.cloud/api/v1
   N8N_API_KEY=n8n_api_abc123def456ghi789jkl012mno345
   ```

5. **Save the file**

---

## Step 3: Restart Claude Code (1 minute)

The `.mcp.json` file has been updated with the `n8n-builder` MCP server, but Claude Code needs to restart to load it.

**How to restart:**
1. Close this Claude Code window/tab
2. Re-open Claude Code in this directory
3. The MCP server will load automatically on startup

**Verify it worked:**
- You should see `n8n-builder` in the MCP servers list
- Type `/mcp` in Claude Code to check

---

## Step 4: Verify Connection (Optional, 2 minutes)

Once Claude Code restarts, I can test the connection:

**What I'll do:**
- Call `list_workflows()` via the MCP n8n-builder
- This should return your existing n8n workflows (or empty list)
- If it works, we're connected! ✅

**What you'll see:**
- I'll show you a list of existing workflows in your n8n instance
- Or confirm "No workflows yet - ready to build!"

---

## Step 5: Workflow Building (Automated)

Once connected, I'll programmatically build:

### Workflow 1: Weekly Suggestions (Thursday 12pm)
**Nodes:**
1. Schedule Trigger (Cron: `0 12 * * 4`)
2. Code: Query Supabase activities
3. Code: Apply 5-component scoring algorithm
4. Code: Get weather from Weather.gov
5. Code: Query Supabase restaurants
6. Code: Format WhatsApp message
7. WhatsApp: Send suggestions

### Workflow 2: Feedback Collection (Monday 8pm)
**Nodes:**
1. Schedule Trigger (Cron: `0 20 * * 1`)
2. WhatsApp: Ask "How was your weekend?"
3. Webhook: Listen for replies
4. Code: Parse response
5. Supabase: Insert to visits table

---

## Step 6: Manual Credential Setup in n8n Web UI (10 minutes)

**Some credentials can't be programmatically created** (sensitive tokens). You'll add these manually in the n8n web UI.

### 6.1 Create Supabase Credential

1. In n8n Cloud, go to **"Credentials"**
2. Click **"Add credential"**
3. Search for **"HTTP Request"** (generic credential)
4. Fill in:
   - **Name:** `Weekend Planner Supabase`
   - **Authentication:** Header Auth
   - **Header Name:** `apikey`
   - **Header Value:** Your Supabase Anon Key (from `.env`)
5. **Test** the credential
6. **Save**

### 6.2 Create WhatsApp Credential

1. In n8n Cloud, go to **"Credentials"**
2. Click **"Add credential"**
3. Search for **"WhatsApp Business Cloud"**
4. Fill in:
   - **Name:** `Weekend Planner WhatsApp`
   - **Access Token:** (from Meta WhatsApp Cloud API)
   - **Phone Number ID:** (from Meta)
5. **Test** the credential (sends test message)
6. **Save**

**Don't have WhatsApp tokens yet?**
- See `n8n-workflows/README.md` section "WhatsApp Setup"
- You can create the workflows now and add WhatsApp later
- They'll run without the WhatsApp node until you add credentials

---

## Step 7: Workflow Testing & Activation (30 minutes)

Once I build the workflows:

1. **I'll create them in "inactive" state** (won't run yet)
2. **You can view them in n8n web UI**
3. **Test manually:**
   - Open workflow in n8n
   - Click "Execute Workflow" to test
   - Check each node's output
4. **Fix any issues together**
5. **Activate** when ready:
   - I can activate via MCP tools
   - Or you can toggle "Active" in web UI

---

## Troubleshooting

### MCP Server Not Loading

**Symptom:** Don't see `n8n-builder` in MCP servers list after restart

**Solution:**
1. Check `.mcp.json` syntax is valid (JSON format)
2. Verify `.env` has `N8N_HOST` and `N8N_API_KEY`
3. Restart Claude Code again
4. Check Claude Code logs for errors

---

### API Connection Failed

**Symptom:** MCP tools return authentication errors

**Solutions:**

**Error: "Invalid API key"**
- Regenerate API key in n8n Cloud settings
- Copy new key to `.env`
- Restart Claude Code

**Error: "Host not found"**
- Verify `N8N_HOST` format: `https://your-instance.app.n8n.cloud/api/v1`
- Make sure to include `/api/v1` at the end
- Check for typos in instance name

**Error: "Network error"**
- Check internet connection
- Verify n8n Cloud instance is running
- Try accessing n8n web UI manually

---

### Credentials Not Working in Workflows

**Symptom:** Workflows fail when trying to access Supabase or WhatsApp

**Solution:**
1. **Check credential names match exactly:**
   - In workflow: `Weekend Planner Supabase`
   - In n8n web UI: Must be exactly the same name
2. **Test credentials individually:**
   - Go to Credentials in n8n
   - Click "Test" on each credential
   - Fix any authentication errors
3. **Verify API keys haven't expired:**
   - Supabase keys are in Settings > API
   - WhatsApp tokens expire (regenerate in Meta)

---

## Security Checklist

Before committing any code:

- [ ] `.env` is in `.gitignore` (already done)
- [ ] `.env.example` has no real values (only templates)
- [ ] API keys are only in `.env` (not in any code files)
- [ ] Workflow JSON files don't contain credentials (they use references)
- [ ] n8n credentials are only in n8n web UI

---

## What Happens Next

Once you've completed Steps 1-3:

1. **Tell me you're ready** ("I've added the credentials and restarted")
2. **I'll verify the connection** (test MCP tools)
3. **I'll build the workflows programmatically** (2-3 hours)
4. **You'll add credentials in web UI** (10 minutes)
5. **We'll test together** (30 minutes)
6. **Activate for production** (Thursday noon, Monday evening triggers)

---

## Quick Reference

**n8n Cloud:**
- Dashboard: https://app.n8n.cloud
- Workflows: https://app.n8n.cloud/workflows
- Credentials: https://app.n8n.cloud/credentials
- Settings > API: Generate API keys

**Required .env Variables:**
```bash
N8N_HOST=https://your-instance.app.n8n.cloud/api/v1
N8N_API_KEY=n8n_api_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxxx...
```

**MCP Server:**
- Package: `mcp-n8n-builder`
- Config file: `.mcp.json`
- Documentation: https://github.com/spences10/mcp-n8n-builder

---

## Ready to Begin?

**Checklist before asking me to build workflows:**

- [ ] I have my n8n Cloud instance URL
- [ ] I've generated an n8n API key
- [ ] I've added both to `.env`
- [ ] I've restarted Claude Code
- [ ] I can see `n8n-builder` in MCP servers list

**When ready, tell me:**
> "Ready to build n8n workflows - credentials are configured"

I'll verify the connection and start building!

---

*This guide will get you from zero to automated weekend suggestions in ~1 hour of setup + 2-3 hours of workflow building.* 🚀
