# Environment Setup Checklist

**Purpose:** Verify all services and API keys are configured correctly before building.

---

## API Keys Setup

### Anthropic (Claude)
- [ ] Account created at console.anthropic.com
- [ ] API key generated
- [ ] `ANTHROPIC_API_KEY` added to `.env`
- [ ] Test: Make a simple API call
- [ ] Verify billing is set up (pay-as-you-go)

### Supabase
- [ ] Project created at supabase.com
- [ ] Database provisioned (free tier)
- [ ] `SUPABASE_URL` added to `.env`
- [ ] `SUPABASE_KEY` (anon) added to `.env`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` added to `.env`
- [ ] Test: Connect via client library
- [ ] SQL Editor accessible in dashboard

### Spotify
- [ ] Developer account created at developer.spotify.com
- [ ] App created in dashboard
- [ ] `SPOTIFY_CLIENT_ID` added to `.env`
- [ ] `SPOTIFY_CLIENT_SECRET` added to `.env`
- [ ] Redirect URI configured
- [ ] Test: OAuth flow with personal account
- [ ] David's account connected
- [ ] Wife's account connected (later)

### WhatsApp Cloud API (Meta)
- [ ] Meta Business account created
- [ ] WhatsApp Business API access requested
- [ ] Business verification submitted
- [ ] `WHATSAPP_API_TOKEN` added to `.env`
- [ ] `WHATSAPP_PHONE_NUMBER_ID` added to `.env`
- [ ] `WHATSAPP_BUSINESS_ACCOUNT_ID` added to `.env`
- [ ] Test: Send test message
- [ ] Webhook configured in n8n

### Google Calendar
- [ ] Google Cloud project created
- [ ] Calendar API enabled
- [ ] OAuth 2.0 credentials created
- [ ] `GOOGLE_CALENDAR_CLIENT_ID` added to `.env`
- [ ] `GOOGLE_CALENDAR_CLIENT_SECRET` added to `.env`
- [ ] OAuth flow completed
- [ ] `GOOGLE_CALENDAR_REFRESH_TOKEN` added to `.env`
- [ ] Test: Read calendar events

### Weather API
- [ ] OpenWeatherMap account created (or using Weather.gov)
- [ ] `OPENWEATHER_API_KEY` added to `.env` (if using OWM)
- [ ] Test: Fetch Oakland weather

### Concert APIs
- [ ] Songkick API key obtained
- [ ] `SONGKICK_API_KEY` added to `.env`
- [ ] Bandsintown app ID configured
- [ ] `BANDSINTOWN_APP_ID` added to `.env`
- [ ] Test: Search for artist events

---

## Services Setup

### Supabase Database
- [ ] Schema created (see database/schema.sql)
- [ ] All tables exist
- [ ] Indexes created
- [ ] Row-level security configured (or disabled for dev)
- [ ] Seed data loaded (activities, restaurants)
- [ ] Test queries run successfully

### n8n
- [ ] n8n project created
- [ ] Required nodes installed:
  - [ ] Anthropic
  - [ ] Supabase
  - [ ] WhatsApp
  - [ ] Spotify
  - [ ] Google Calendar
  - [ ] HTTP Request
  - [ ] Cron
  - [ ] Code
- [ ] Environment variables configured in n8n
- [ ] Webhooks accessible from internet (or using tunneling)

---

## MCP Servers

### Orchestrator
- [ ] Dependencies installed (`npm install`)
- [ ] Builds successfully (`npm run build`)
- [ ] Can be loaded in Claude Code
- [ ] Tools respond correctly

### Activity Planner
- [ ] Dependencies installed
- [ ] Builds successfully
- [ ] Can connect to Supabase
- [ ] Tools respond correctly

### Music Scout
- [ ] Dependencies installed
- [ ] Builds successfully
- [ ] Spotify API connected
- [ ] Tools respond correctly

### Food Finder
- [ ] Dependencies installed
- [ ] Builds successfully
- [ ] Can query restaurants
- [ ] Tools respond correctly

### Schedule Sync
- [ ] Dependencies installed
- [ ] Builds successfully
- [ ] Calendar API connected
- [ ] Weather API connected
- [ ] Tools respond correctly

---

## Environment File Check

Run this to verify `.env` has all required keys:

```bash
# From project root
cat .env | grep -E '^[A-Z_]+=' | cut -d'=' -f1 | sort
```

**Expected output (all keys present):**
```
ANTHROPIC_API_KEY
BANDSINTOWN_APP_ID
GOOGLE_CALENDAR_CLIENT_ID
GOOGLE_CALENDAR_CLIENT_SECRET
GOOGLE_CALENDAR_REFRESH_TOKEN
OPENWEATHER_API_KEY
SONGKICK_API_KEY
SPOTIFY_CLIENT_ID
SPOTIFY_CLIENT_SECRET
SPOTIFY_REDIRECT_URI
SUPABASE_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
WHATSAPP_API_TOKEN
WHATSAPP_BUSINESS_ACCOUNT_ID
WHATSAPP_PHONE_NUMBER_ID
```

---

## Testing Connectivity

### Test Supabase Connection

```bash
# Install Supabase CLI
npm install -g supabase

# Test connection
supabase db remote connect
```

### Test Spotify API

```bash
curl -X POST "https://accounts.spotify.com/api/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET"
```

### Test WhatsApp API

```bash
curl -X GET "https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID" \
  -H "Authorization: Bearer YOUR_API_TOKEN"
```

### Test Google Calendar API

```bash
# Use OAuth Playground or test in n8n Google Calendar node
# https://developers.google.com/oauthplayground
```

---

## Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] No API keys committed to git
- [ ] `.env.example` has placeholder values only
- [ ] API keys rotated if accidentally committed
- [ ] Supabase service role key kept secret (only in server-side code)

---

## Deployment Readiness (for later)

- [ ] All API keys work in production environment
- [ ] Webhooks are publicly accessible
- [ ] HTTPS configured for webhooks
- [ ] Database backups enabled
- [ ] Monitoring configured
- [ ] Error logging set up

---

**Status:** ⬜ Not Started | 🟨 In Progress | ✅ Complete

*Update this checklist as you complete each item.*
