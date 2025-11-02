# Weekend Activity Planner - Complete Setup Guide

**Step-by-step instructions for getting everything running**

---

## Prerequisites

- macOS (as per user requirements)
- Node.js 18+ installed
- Python 3.9+ installed
- Git installed
- Text editor (VS Code recommended)

---

## Part 1: Database Setup (15 minutes)

### Step 1: Create Supabase Account

1. Go to https://supabase.com
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email
4. Create new organization (name it whatever you like)

### Step 2: Create Project

1. Click "New Project"
2. Project name: `weekend-activity-planner`
3. Database password: Generate strong password (SAVE THIS!)
4. Region: Choose closest to San Francisco (us-west-1 or us-west-2)
5. Click "Create new project"
6. Wait 2-3 minutes for provisioning

### Step 3: Get API Credentials

1. In Supabase dashboard, go to Project Settings (gear icon) → API
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `[your-anon-key]`
   - **service_role key**: `[your-service-role-key]` (click "Reveal")

### Step 4: Add to .env File

```bash
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner"
cp .env.example .env
```

Edit `.env` and add:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

### Step 5: Run Database Schema

1. In Supabase dashboard, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Open `database/schema.sql` from project
4. Copy entire contents
5. Paste into Supabase SQL Editor
6. Click "Run" (bottom right)
7. Should see: "Success. No rows returned"
8. Check "Table Editor" - you should see 10 tables!

### Step 6: Load Seed Data

**Activities:**
1. New Query in SQL Editor
2. Copy contents of `database/seed-activities.sql`
3. Paste and Run
4. Should see: "Success" with activity count

**Restaurants:**
1. New Query
2. Copy contents of `database/seed-restaurants.sql`
3. Paste and Run
4. Should see: "Success" with restaurant count

**Verify:**
- Go to Table Editor
- Click "activities" - should see ~75 rows
- Click "restaurants" - should see ~25 rows

✅ **Database setup complete!**

---

## Part 2: Rating UI Setup (10 minutes)

### Step 1: Install Python Dependencies

```bash
cd rating-ui
python3 -m pip install -r requirements.txt
```

### Step 2: Test the App

```bash
streamlit run streamlit_app.py
```

Should open in browser at http://localhost:8501

### Step 3: Rate Activities

1. Click through activities
2. Rate ones you've visited:
   - Select "Yes, we've been!"
   - Rate 3yo enjoyment (1-5)
   - Rate 5yo enjoyment (1-5)
   - Rate overall (1-5)
   - Check "Would return?" if you'd go back
   - Set last visited date (approximate is fine)
   - Add notes about what worked/didn't
3. For ones you haven't been:
   - Select "Heard of it" or "Never heard of it"
   - Mark if interested
4. Rate at least 30-40 activities (prioritize ones you've actually visited)

### Step 4: Push to Supabase

1. Click "Push to Supabase" button at bottom
2. Verify success message
3. Check Supabase Table Editor → visits table (should have records)

✅ **Rating setup complete!**

---

## Part 3: API Keys Setup (2-3 hours total, spread over days)

### Anthropic API (10 minutes)

**Used for:** AI agent workflows in n8n

1. Go to https://console.anthropic.com
2. Sign up / Log in
3. Go to API Keys section
4. Click "Create Key"
5. Name: "weekend-planner"
6. Copy key (starts with `sk-ant-`)
7. Add to `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-xxxxx
   ```
8. Set up billing (pay-as-you-go, ~$5-10/month expected)

### Spotify API (30 minutes)

**Used for:** Concert discovery from listening history

1. Go to https://developer.spotify.com/dashboard
2. Log in with Spotify account
3. Click "Create app"
4. App name: "Weekend Activity Planner"
5. App description: "Personal family activity planning"
6. Redirect URI: `http://localhost:8888/callback`
7. Which API/SDKs: Web API
8. Click "Save"
9. Click "Settings"
10. Copy Client ID and Client Secret
11. Add to `.env`:
    ```
    SPOTIFY_CLIENT_ID=xxxxx
    SPOTIFY_CLIENT_SECRET=xxxxx
    SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
    ```

**OAuth Setup (get refresh token):**
Will need separate script to get refresh token. Document this in SPOTIFY-OAUTH.md.

### Google Calendar API (45 minutes)

**Used for:** Calendar conflict checking

1. Go to https://console.cloud.google.com
2. Create new project: "Weekend Planner"
3. Enable Google Calendar API:
   - Click "Enable APIs and Services"
   - Search "Google Calendar API"
   - Click "Enable"
4. Create OAuth credentials:
   - Go to "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Desktop app"
   - Name: "Weekend Planner Calendar"
   - Click "Create"
   - Download JSON credentials
5. Get refresh token (will need OAuth flow script)
6. Add to `.env`:
   ```
   GOOGLE_CALENDAR_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CALENDAR_CLIENT_SECRET=xxxxx
   GOOGLE_CALENDAR_REFRESH_TOKEN=xxxxx
   ```

### Weather API (5 minutes)

**Option 1: Weather.gov (FREE, recommended for US)**
No API key needed! Just use:
```
WEATHER_API_PROVIDER=weather.gov
```

**Option 2: OpenWeatherMap (backup)**
1. Go to https://openweathermap.org/api
2. Sign up for free account
3. Go to API keys
4. Copy default key or create new one
5. Add to `.env`:
   ```
   OPENWEATHER_API_KEY=xxxxx
   ```

### Concert APIs (10 minutes each)

**Songkick:**
1. Go to https://www.songkick.com/developer
2. Request API key (may take 1-2 days for approval)
3. Add to `.env`:
   ```
   SONGKICK_API_KEY=xxxxx
   ```

**Bandsintown:**
1. Just need an app ID (identifier, not secret)
2. Add to `.env`:
   ```
   BANDSINTOWN_APP_ID=weekend-activity-planner
   ```

### WhatsApp Cloud API (2-7 days)

**Important:** Business verification takes time. Start this early!

1. Go to https://developers.facebook.com
2. Log in with Facebook account
3. Click "My Apps" → "Create App"
4. Use case: "Other"
5. Type: "Business"
6. App name: "Weekend Planner"
7. Contact email: your email
8. Click "Create App"
9. Add WhatsApp product
10. Set up Business Account:
    - Business name: Your name or "Shein Family"
    - Business email: your email
    - Business website: Can use GitHub repo URL or create simple page
11. Submit for verification (may take 2-7 days)
12. Once approved, get:
    - Phone Number ID
    - WhatsApp Business Account ID
    - Access Token
13. Add to `.env`:
    ```
    WHATSAPP_API_TOKEN=EAAxxxxx
    WHATSAPP_PHONE_NUMBER_ID=123456789
    WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
    WHATSAPP_VERIFY_TOKEN=your_custom_secret_here
    ```

**Fallback:** If Meta verification is slow, can use Twilio ($5-10/month) temporarily

✅ **API keys setup complete!**

---

## Part 4: MCP Servers Setup (varies)

### Install Dependencies for Each Server

```bash
# Orchestrator
cd mcp-servers/orchestrator
npm install

# Activity Planner (when created)
cd ../activity-planner
npm install

# Music Scout (when created)
cd ../music-scout
npm install

# Food Finder (when created)
cd ../food-finder
npm install

# Schedule Sync (when created)
cd ../schedule-sync
npm install
```

### Build Each Server

```bash
cd mcp-servers/orchestrator
npm run build
```

Repeat for each server.

### Test via Claude Code

```bash
claude code
```

Then use the tools:
```
> Use orchestrator tool: plan_weekend("2025-10-12")
```

---

## Part 5: n8n Setup (when ready for automation)

### Option 1: n8n Cloud (easiest)

1. Go to https://n8n.io
2. Start free trial
3. Create new workflow
4. Import workflow JSON from `n8n-workflows/`

### Option 2: Self-Hosted n8n (free)

```bash
npm install -g n8n
n8n start
```

Access at http://localhost:5678

---

## Verification Checklist

Run through this checklist to verify everything works:

### Database
- [ ] Supabase project created
- [ ] Schema applied (10 tables visible)
- [ ] Seed data loaded (~75 activities, ~25 restaurants)
- [ ] Credentials in .env

### Rating UI
- [ ] Dependencies installed
- [ ] App runs (`streamlit run streamlit_app.py`)
- [ ] Loads activities from Supabase
- [ ] Can save ratings
- [ ] Pushed ratings to Supabase (visits table has records)

### API Keys
- [ ] Anthropic API key in .env and tested
- [ ] Supabase credentials in .env and tested
- [ ] Spotify client ID/secret in .env
- [ ] Google Calendar credentials setup started
- [ ] Weather API configured (Weather.gov or OWM)
- [ ] Songkick API key requested
- [ ] Bandsintown app ID in .env
- [ ] WhatsApp API verification submitted

### MCP Servers
- [ ] Orchestrator builds without errors (`npm run build`)
- [ ] Can load in Claude Code
- [ ] Other servers: TBD (build them first)

---

## Troubleshooting

### "Supabase connection failed"
- Check URL and keys in .env
- Verify project is active in Supabase dashboard
- Check if RLS is blocking queries (disable for dev)

### "Activities not loading in Streamlit"
- Verify seed data ran successfully
- Check Supabase Table Editor for data
- Check browser console for errors

### "npm install fails"
- Make sure Node.js 18+ installed: `node --version`
- Try deleting `node_modules` and `package-lock.json`, run again

### "Claude Code can't find MCP server"
- Verify server built: `npm run build` in server directory
- Check dist/ folder exists
- Verify server is in Claude Code MCP config

---

## Next Steps After Setup

1. **Implement MCP servers** - See `building/IMPLEMENTATION-GUIDE.md`
2. **Create n8n workflows** - See workflow templates
3. **Test end-to-end** - See `building/TESTING.md`
4. **Onboard wife** - Set up WhatsApp access

---

## Estimated Setup Time

- **Database (Supabase)**: 15 minutes
- **Rating UI**: 10 minutes
- **Bootstrap rating session**: 30-45 minutes
- **API keys (interactive parts)**: 2-3 hours
- **MCP servers (installation)**: 30 minutes
- **Waiting for verifications**: 2-7 days (WhatsApp)

**Total active time**: ~4-5 hours
**Total calendar time**: 3-7 days (due to API verifications)

---

*Follow this guide step-by-step and you'll have a working system!*
