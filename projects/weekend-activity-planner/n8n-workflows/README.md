# n8n Workflows - Weekend Activity Planner

**Purpose:** Automated workflows for weekly activity suggestions and feedback collection.

---

## Overview

This directory contains n8n workflow configurations for automating the Weekend Activity Planner system.

### Workflows (v1)

1. **Weekly Suggestions** - Thursday 12:00 PM
   - Calls Orchestrator MCP `plan_weekend` tool
   - Generates 3 activity suggestions for the weekend
   - Sends formatted message via WhatsApp

2. **Feedback Collection** - Monday 8:00 PM
   - Asks "How was your weekend?" via WhatsApp
   - Listens for user replies via webhook
   - Saves ratings to Supabase visits table

### Deferred to v2

- ~~Spotify Sync~~ (Music Scout MCP not built yet)
- ~~Concert Discovery~~ (Music Scout MCP not built yet)
- ~~Event Discovery~~ (integrate into Activity Planner in v2)
- ~~Ticket Reminders~~ (v2 feature)

---

## Setup Instructions

### 1. Start n8n

```bash
# Start n8n locally
n8n start

# Access web UI at http://localhost:5678
```

**First time setup:**
- Create an account (local only, data stays on your machine)
- Set a password
- Skip any cloud sync prompts (we're running locally)

### 2. MCP Server Integration

Our MCP servers need to be accessible to n8n. There are two approaches:

#### Option A: Direct Function Calls (Recommended for Testing)

Create a simple Express server wrapper around our MCP servers:

```bash
cd /Users/dshein/Personal\ Projects/projects/weekend-activity-planner
mkdir mcp-http-wrapper
cd mcp-http-wrapper
npm init -y
npm install express body-parser
```

Create `server.js`:
```javascript
const express = require('express');
const bodyParser = require('body-parser');
const { planWeekend } = require('../mcp-servers/orchestrator/dist/exports.js');

const app = express();
app.use(bodyParser.json());

app.post('/plan_weekend', async (req, res) => {
  try {
    const result = await planWeekend(req.body);
    res.json(JSON.parse(result));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('MCP HTTP wrapper listening on port 3000'));
```

Start the wrapper:
```bash
node server.js
```

Now n8n can call `http://localhost:3000/plan_weekend` via HTTP Request node.

#### Option B: Claude Code MCP Integration (Production)

**Note:** This requires n8n to integrate with Claude Code's MCP system, which may require additional setup. Option A is simpler for initial testing.

### 3. WhatsApp Setup

#### Test Mode (Immediate)

1. Visit https://developers.facebook.com/
2. Create new app → WhatsApp Business Platform
3. Select "test" mode
4. Get test phone number (instant)
5. Add your number to test recipients
6. Copy access token to use in n8n

#### Production Mode (2-7 days)

1. Submit business verification
2. Request production access
3. Wait for Meta approval (2-7 days)
4. Configure webhook URL (n8n provides this after creating webhook node)

---

## Workflow 1: Weekly Suggestions

**Trigger:** Every Thursday at 12:00 PM

**Nodes:**

1. **Schedule Trigger**
   - Cron: `0 12 * * 4` (Thursday noon)

2. **HTTP Request - Get Weather**
   - Method: GET
   - URL: `https://api.weather.gov/points/37.8324,-122.2128`
   - Headers: `User-Agent: WeekendActivityPlanner/1.0`
   - Parse JSON response → Get forecast URL

3. **HTTP Request - Plan Weekend**
   - Method: POST
   - URL: `http://localhost:3000/plan_weekend`
   - Body:
     ```json
     {
       "date": "this Saturday",
       "num_suggestions": 3
     }
     ```

4. **Function - Format WhatsApp Message**
   - Parse JSON response
   - Format as readable WhatsApp message:
     ```
     🎉 Weekend Activity Suggestions for Sat Oct 19

     Option 1: [Activity Name]
     📍 [Location] (25 min drive)
     ⭐ Rating: 4.8/5 | 🆕 Novelty: High
     🌤️ Perfect weather for this!

     🍽️ Lunch: [Restaurant Name]
     📍 5 min from activity
     ✅ Celiac safe, sesame-free

     ⏰ Suggested timing: 10am-2pm

     [Repeat for Options 2 & 3]
     ```

5. **WhatsApp Business Cloud - Send Message**
   - To: Your phone number
   - Message: Formatted suggestions

**Testing:**
- Use "Execute Workflow" button (manual trigger)
- Verify message received on WhatsApp
- Check formatting is readable
- Verify dietary restrictions are respected

---

## Workflow 2: Feedback Collection

**Trigger:** Every Monday at 8:00 PM

**Nodes:**

1. **Schedule Trigger**
   - Cron: `0 20 * * 1` (Monday 8pm)

2. **WhatsApp Business Cloud - Send Message**
   - To: Your phone number
   - Message: "How was your weekend? Which activities did you do? Rate each one! (Reply with activity name and YES/NO/MAYBE)"

3. **Webhook (Separate Workflow)**
   - Create webhook to listen for WhatsApp replies
   - URL: `https://[your-domain]/webhook/whatsapp` or use n8n cloud webhook
   - WhatsApp will POST incoming messages here

4. **Function - Parse Reply**
   - Extract activity names and ratings
   - Look up activity IDs from database

5. **Supabase - Insert Visit**
   - Table: `visits`
   - Columns:
     - `activity_id` (from lookup)
     - `visited_at` (infer from "last Saturday")
     - `liked_by_3yo` (true if "YES")
     - `liked_by_5yo` (true if "YES")
     - `would_return` (true if not "NO")
     - `notes` (any additional text)

**Testing:**
- Manual trigger to send question
- Reply with test rating
- Check Supabase visits table for new row
- Verify data is correctly parsed

---

## Environment Variables

Add to `.env`:

```bash
# n8n (if using cloud webhook)
N8N_WEBHOOK_URL=https://your-n8n-instance.app.n8n.cloud/webhook/...

# WhatsApp Business Cloud API
WHATSAPP_ACCESS_TOKEN=EAAxxxxxxxxxxxx
WHATSAPP_PHONE_NUMBER_ID=12345678901234567
WHATSAPP_RECIPIENT_NUMBER=+15105551234

# MCP HTTP Wrapper (if using Option A)
MCP_WRAPPER_URL=http://localhost:3000
```

---

## Workflow Files

When you export workflows from n8n, save them here:

```
n8n-workflows/
├── README.md                          # This file
├── weekly-suggestions.json            # Workflow 1 export
├── feedback-collection.json           # Workflow 2 export
└── webhook-whatsapp-replies.json      # Webhook listener workflow
```

**To export a workflow:**
1. Open workflow in n8n
2. Click "..." menu → Download
3. Save JSON file to this directory
4. Commit to git (workflows are just configuration, no secrets)

**To import a workflow:**
1. Open n8n
2. Click "+" → Import from File
3. Select JSON file
4. Update any credentials/tokens
5. Activate workflow

---

## Testing Checklist

### Weekly Suggestions Workflow

- [ ] Manual trigger sends WhatsApp message
- [ ] Message contains 3 suggestions
- [ ] Each suggestion includes: activity, restaurant, timing, weather
- [ ] Dietary restrictions are respected (celiac, sesame, cashew, flax)
- [ ] Drive times are accurate
- [ ] Message is formatted and readable
- [ ] Schedule trigger works (test by setting to "in 2 minutes")

### Feedback Collection Workflow

- [ ] Manual trigger sends "how was your weekend?" message
- [ ] Replying via WhatsApp triggers webhook
- [ ] Reply is parsed correctly
- [ ] Activity lookup works (matches name to ID)
- [ ] Data saves to Supabase visits table
- [ ] Binary ratings (YES/NO) map correctly to true/false

---

## Troubleshooting

### MCP Servers Not Responding

**Problem:** HTTP Request node gets connection refused

**Solution:**
1. Verify MCP HTTP wrapper is running: `ps aux | grep node`
2. Check port 3000 is available: `lsof -i :3000`
3. Test directly: `curl http://localhost:3000/plan_weekend -X POST -H "Content-Type: application/json" -d '{"date": "Saturday", "num_suggestions": 3}'`

### WhatsApp Messages Not Sending

**Problem:** WhatsApp node fails with authentication error

**Solution:**
1. Verify access token is correct and not expired
2. Check phone number ID matches your WhatsApp Business account
3. Ensure recipient number is in test mode recipients list (if using test mode)
4. Check Meta Business Suite for API errors

### Webhook Not Receiving Messages

**Problem:** Reply to WhatsApp but webhook doesn't trigger

**Solution:**
1. Verify webhook URL is registered in Meta app settings
2. Check webhook verification token matches
3. Test webhook directly: `curl https://your-n8n-instance.app.n8n.cloud/webhook/whatsapp -X POST -d '{"test": "data"}'`
4. Check n8n execution log for errors

### Database Writes Failing

**Problem:** Visit data not saving to Supabase

**Solution:**
1. Verify Supabase credentials in `.env`
2. Check table permissions (service role key has full access)
3. Verify activity_id lookup is finding matches
4. Check Supabase logs for SQL errors

---

## Next Steps After Setup

1. **Run manual tests** for both workflows
2. **Set correct timezones** (America/Los_Angeles for Oakland)
3. **Activate workflows** (toggle "Active" in n8n UI)
4. **Wait for Thursday noon** - First automated run!
5. **Monitor first week:**
   - Thursday: Check WhatsApp message received
   - Saturday: Use suggested activities
   - Monday: Reply with ratings
   - Tuesday: Verify visits table has new data
6. **Iterate based on feedback:**
   - Adjust message formatting
   - Tune scoring algorithm if suggestions are off
   - Add more seed data if needed

---

## Future Enhancements (v2)

- **Music Scout integration** - Concert discovery workflow
- **Google Calendar** - Real conflict checking
- **Ticket reminders** - Alert for upcoming concerts
- **Event discovery** - Scrape local event sites daily
- **Multi-user support** - Wife can also trigger suggestions
- **Voice replies** - Transcribe WhatsApp voice messages for ratings

---

*n8n workflows will make this system run on autopilot. Once set up, you'll get suggestions every Thursday without lifting a finger!* 🤖
