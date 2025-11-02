# API Reference

**Purpose:** Quick links to all API documentation and resources.

---

## Anthropic (Claude)

**Used for:** n8n AI Agent workflows, MCP server interactions

- **Documentation**: https://docs.anthropic.com
- **API Console**: https://console.anthropic.com
- **Pricing**: https://www.anthropic.com/pricing
- **Rate Limits**: 50 requests/min (Tier 1), 1000 requests/min (Tier 2)
- **Models**:
  - `claude-sonnet-4-5` (recommended for this project)
  - `claude-3-7-sonnet` (faster, cheaper alternative)

**Environment Variables:**
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

---

## Supabase

**Used for:** PostgreSQL database, authentication, API

- **Dashboard**: https://supabase.com/dashboard
- **Documentation**: https://supabase.com/docs
- **JS Client Docs**: https://supabase.com/docs/reference/javascript
- **SQL Editor**: Available in dashboard
- **Free Tier Limits**:
  - 500 MB database
  - 50,000 monthly active users
  - 2 GB bandwidth/month
  - 2 GB file storage

**Environment Variables:**
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]
```

---

## Spotify

**Used for:** Music preference sync, concert artist discovery

- **Developer Dashboard**: https://developer.spotify.com/dashboard
- **Web API Docs**: https://developer.spotify.com/documentation/web-api
- **OAuth Guide**: https://developer.spotify.com/documentation/web-api/tutorials/code-flow
- **Scopes Needed**:
  - `user-top-read` (top artists)
  - `user-read-recently-played` (recent listening)
- **Rate Limits**:
  - Standard: 30 requests/sec
  - Extended: 180 requests/sec (after approval)

**Environment Variables:**
```
SPOTIFY_CLIENT_ID=xxxxx
SPOTIFY_CLIENT_SECRET=xxxxx
SPOTIFY_REDIRECT_URI=http://localhost:8888/callback
```

**OAuth Flow:**
1. User clicks authorization link
2. Redirects to Spotify login
3. User approves
4. Redirect back with auth code
5. Exchange for access + refresh tokens
6. Store refresh token in Supabase

---

## WhatsApp Cloud API (Meta)

**Used for:** Bot messaging, notifications

- **Business Dashboard**: https://business.facebook.com
- **API Docs**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Getting Started**: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
- **Message Templates**: https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates
- **Free Tier**: 1,000 service conversations/month
- **Rate Limits**: 80 messages/sec

**Environment Variables:**
```
WHATSAPP_API_TOKEN=EAAxxxxx
WHATSAPP_PHONE_NUMBER_ID=123456789
WHATSAPP_BUSINESS_ACCOUNT_ID=987654321
```

**Webhook Verification:**
- Verify token: Set in n8n webhook
- Callback URL: Your n8n webhook URL

---

## Google Calendar API

**Used for:** Calendar conflict checking, schedule integration

- **API Console**: https://console.cloud.google.com
- **Calendar API Docs**: https://developers.google.com/calendar/api/guides/overview
- **Scopes Needed**:
  - `https://www.googleapis.com/auth/calendar.readonly`
- **Rate Limits**:
  - 1,000,000 queries/day
  - 10 queries/sec per user

**Environment Variables:**
```
GOOGLE_CALENDAR_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=xxxxx
GOOGLE_CALENDAR_REFRESH_TOKEN=xxxxx
```

**OAuth Setup:**
1. Create project in Google Cloud Console
2. Enable Calendar API
3. Create OAuth 2.0 credentials
4. Authorize and get refresh token

---

## OpenWeatherMap

**Used for:** Weather forecasts (alternative: Weather.gov)

- **API Docs**: https://openweathermap.org/api
- **Free Tier**: 1,000 calls/day, 60 calls/min
- **Endpoints**:
  - Current weather: `/data/2.5/weather`
  - 5-day forecast: `/data/2.5/forecast`

**Environment Variables:**
```
OPENWEATHER_API_KEY=xxxxx
```

**Alternative (FREE, no key):**
- **Weather.gov API**: https://www.weather.gov/documentation/services-web-api
- No API key required
- US only
- More reliable for Bay Area

---

## Songkick

**Used for:** Concert discovery

- **API Docs**: https://www.songkick.com/developer
- **Free Tier**: Non-commercial use
- **Endpoints**:
  - Artist search: `/api/3.0/search/artists.json`
  - Artist events: `/api/3.0/artists/{id}/calendar.json`
  - Metro events: `/api/3.0/metro_areas/{id}/calendar.json`
- **Rate Limits**: 5 requests/sec

**Environment Variables:**
```
SONGKICK_API_KEY=xxxxx
```

**Metro Area IDs:**
- San Francisco Bay Area: 26330

---

## Bandsintown

**Used for:** Concert discovery (backup to Songkick)

- **API Docs**: https://artists.bandsintown.com/api-docs
- **Free Tier**: Available for non-commercial use
- **Endpoints**:
  - Artist events: `/artists/{artistname}/events`
  - Location events: `/events/search`

**Environment Variables:**
```
BANDSINTOWN_APP_ID=weekend-activity-planner
```

**Note:** App ID is just an identifier, not a secret key

---

## n8n

**Used for:** Workflow automation, WhatsApp bot hosting

- **Documentation**: https://docs.n8n.io
- **Self-Hosted Docs**: https://docs.n8n.io/hosting/
- **Cloud**: https://n8n.io (paid)
- **Nodes Library**: https://n8n.io/integrations

**Key Nodes for This Project:**
- Anthropic (Claude AI)
- Supabase
- WhatsApp
- Spotify
- Google Calendar
- HTTP Request
- Cron (scheduling)
- Code (JavaScript/Python)

---

## Rate Limit Summary

| Service | Limit | Notes |
|---------|-------|-------|
| Anthropic | 50 req/min (T1) | Upgrade to T2 for 1000/min |
| Supabase | 2 GB bandwidth/month | Should be plenty |
| Spotify | 30 req/sec | Standard tier |
| WhatsApp | 80 msg/sec | Way more than needed |
| Google Calendar | 10 req/sec/user | Plenty |
| OpenWeatherMap | 60 calls/min | 1000/day on free |
| Songkick | 5 req/sec | Should be fine |

---

## Cost Estimates

| Service | Monthly Cost |
|---------|--------------|
| Supabase | $0 (free tier) |
| Anthropic | $5-10 (pay-as-you-go) |
| WhatsApp | $0 (free tier, 1k convos) |
| Spotify | $0 (free tier) |
| Google Calendar | $0 (free) |
| Weather | $0 (free) |
| Concert APIs | $0 (free for non-commercial) |
| **Total** | **~$5-10/month** |

---

*Keep this document updated as APIs change or new services are added.*
