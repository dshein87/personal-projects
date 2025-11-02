# n8n Workflow Updates - Email + Magic Links

**Purpose:** Update existing n8n workflow to send email with magic link instead of WhatsApp

**Workflow ID:** wRRp1fTwNzOHr9rY
**Workflow URL:** https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY

**Status:** In Progress
**Created:** 2025-11-02

---

## Current Workflow Structure

**Existing nodes (from 2025-10-18):**
1. Manual Trigger
2. Query Visit History
3. Query Activities
4. Score Activities
5. Query Restaurants
6. Match Restaurants
7. Format Message (WhatsApp-style text)

**Expected:** 7 nodes currently

---

## Required Updates

### New Nodes to Add (4 nodes)

**After "Format Message" node, add:**

1. **Generate Magic Link** (Code node)
2. **Store Token in Supabase** (HTTP Request node)
3. **Store Suggestions in Conversation** (HTTP Request node)
4. **Send Email via Gmail** (Gmail node)

---

## Node 1: Generate Magic Link

**Node Type:** Code (JavaScript)
**Name:** Generate Magic Link
**Position:** After "Format Message"

**Code:**
```javascript
const crypto = require('crypto');

// Generate unique conversation ID
const date = new Date().toISOString().split('T')[0];  // 2025-11-02
const randomToken = crypto.randomBytes(16).toString('hex');  // 32 char hex
const convId = `${date}-${randomToken}`;

// Calculate expiration (7 days from now)
const expiresAt = new Date();
expiresAt.setDate(expiresAt.getDate() + 7);

// Dashboard URL (UPDATE THIS with your Streamlit Cloud URL)
const dashboardUrl = `https://weekend-planner-[YOUR-APP].streamlit.app?conv_id=${convId}`;

return {
  json: {
    conv_id: convId,
    expires_at: expiresAt.toISOString(),
    dashboard_url: dashboardUrl
  }
};
```

**Output:**
```json
{
  "conv_id": "2025-11-02-a3f8e9c1d4b2...",
  "expires_at": "2025-11-09T12:00:00.000Z",
  "dashboard_url": "https://weekend-planner-[app].streamlit.app?conv_id=2025-11-02-a3f8..."
}
```

---

## Node 2: Store Token in Supabase

**Node Type:** HTTP Request
**Name:** Store Magic Link Token
**Position:** After "Generate Magic Link"

**Configuration:**
```
Method: POST
URL: https://ohdmrfyyavlkoflbbjsd.supabase.co/rest/v1/conversation_tokens

Authentication: None (use headers)

Headers:
  apikey: {{ $env.SUPABASE_ANON_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: return=minimal

Body (JSON):
{
  "conv_id": "{{ $json.conv_id }}",
  "expires_at": "{{ $json.expires_at }}"
}
```

**Expected Response:** 201 Created (empty body with return=minimal)

---

## Node 3: Store Suggestions in Conversation

**Node Type:** HTTP Request
**Name:** Store Suggestions in Conversation
**Position:** After "Store Magic Link Token"

**Configuration:**
```
Method: POST
URL: https://ohdmrfyyavlkoflbbjsd.supabase.co/rest/v1/conversations

Authentication: None (use headers)

Headers:
  apikey: {{ $env.SUPABASE_ANON_KEY }}
  Authorization: Bearer {{ $env.SUPABASE_SERVICE_ROLE_KEY }}
  Content-Type: application/json
  Prefer: return=minimal

Body (JSON):
{
  "conversation_id": "{{ $('Generate Magic Link').item.json.conv_id }}",
  "role": "assistant",
  "content": "{{ $('Format Message').item.json.message }}",
  "metadata": {
    "type": "weekly_suggestions",
    "activity_ids": {{ $('Score Activities').item.json.top_activity_ids }},
    "generated_at": "{{ $now.toISO() }}"
  }
}
```

**Note:** Adjust `top_activity_ids` based on actual output from Score Activities node

**Expected Response:** 201 Created

---

## Node 4: Send Email via Gmail

**Node Type:** Gmail
**Name:** Send Weekly Suggestions Email
**Position:** After "Store Suggestions in Conversation"

**Configuration:**

**Resource:** Message
**Operation:** Send

**To:** `{{ $env.WEEKLY_SUGGESTION_EMAIL }}` (david.shein@gmail.com)
**Subject:** 🎉 Your Weekend Suggestions Are Ready!

**Email Type:** HTML

**Message (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekend Suggestions</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a73e8; margin-top: 0;">🎉 Weekend Activity Suggestions</h1>

    <p style="font-size: 16px; color: #333;">Hi there!</p>

    <p style="font-size: 16px; color: #333;">I've prepared 3 personalized activity suggestions for this weekend based on:</p>

    <ul style="font-size: 16px; color: #333; line-height: 1.6;">
      <li>✅ Weather forecast</li>
      <li>✅ Your calendar availability</li>
      <li>✅ Past activity ratings</li>
      <li>✅ Drive time preferences</li>
    </ul>

    <div style="margin: 40px 0; text-align: center;">
      <a href="{{ $('Generate Magic Link').item.json.dashboard_url }}"
         style="background-color: #1a73e8;
                color: white;
                padding: 16px 32px;
                text-decoration: none;
                border-radius: 6px;
                font-size: 18px;
                font-weight: 500;
                display: inline-block;">
        View Suggestions & Chat 💬
      </a>
    </div>

    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 30px 0;">
      <p style="margin: 0; font-size: 14px; color: #666; line-height: 1.6;">
        💡 <strong>New!</strong> You can now chat with me about the suggestions!<br>
        Ask questions, share feedback, or let me know how your adventures go.
      </p>
    </div>

    <p style="font-size: 14px; color: #666;">
      Questions? Feedback? Just click the link above and chat with me!<br>
      This link is valid for 7 days.
    </p>

    <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">

    <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
      🤖 Powered by Weekend Activity Planner<br>
      📧 You're receiving this because you signed up for weekly suggestions
    </p>
  </div>
</body>
</html>
```

**Options:**
- [ ] Turn OFF "n8n Attribution" (remove "sent with n8n" footer)
- [ ] Set "Reply To" to your email if desired

**Gmail Authentication:**
- Will need to authenticate Gmail account via OAuth
- n8n will prompt for Google login on first use

---

## Environment Variables Needed

Add these to n8n environment (if not already present):

```bash
SUPABASE_ANON_KEY=[from .env]
SUPABASE_SERVICE_ROLE_KEY=[from .env]
WEEKLY_SUGGESTION_EMAIL=david.shein@gmail.com
```

**Note:** These should already be in n8n from previous workflow setup

---

## Testing Checklist

**Before running full workflow:**
1. [ ] Verify Gmail authentication works
2. [ ] Test "Generate Magic Link" node (check output)
3. [ ] Test "Store Token" node (check Supabase table)
4. [ ] Test "Store Suggestions" node (check conversations table)
5. [ ] Test email sending (send test email)

**Full workflow test:**
1. [ ] Run workflow manually (Execute Workflow button)
2. [ ] Check email inbox for message
3. [ ] Click magic link in email
4. [ ] Verify dashboard loads with suggestions
5. [ ] Test chat functionality

**Verification queries (Supabase SQL Editor):**
```sql
-- Check token was created
SELECT * FROM conversation_tokens ORDER BY created_at DESC LIMIT 1;

-- Check suggestions were stored
SELECT * FROM conversations ORDER BY created_at DESC LIMIT 1;
```

---

## Migration Steps

**Step 1: Add nodes to workflow**
1. Open workflow in n8n UI
2. Add 4 new nodes after "Format Message"
3. Configure each node per specs above
4. Connect nodes in sequence

**Step 2: Update dashboard URL**
1. After deploying to Streamlit Cloud, get the URL
2. Update "Generate Magic Link" node with actual URL
3. Format: `https://[app-name]-[hash].streamlit.app?conv_id=${convId}`

**Step 3: Configure Gmail**
1. Click Gmail node
2. Create new Gmail credential
3. Authenticate with Google account (david.shein@gmail.com)
4. Grant n8n permissions

**Step 4: Test**
1. Execute workflow manually
2. Verify all nodes succeed
3. Check email received
4. Test magic link works

**Step 5: Activate**
1. Set workflow to "Active"
2. Configure schedule (Thursday noon PST)
3. Monitor first automated run

---

## Alternative: If Gmail OAuth Fails

**Use HTTP Request with Gmail API:**
```
Method: POST
URL: https://gmail.googleapis.com/gmail/v1/users/me/messages/send

Headers:
  Authorization: Bearer {{ $env.GMAIL_ACCESS_TOKEN }}
  Content-Type: application/json

Body:
{
  "raw": [base64 encoded email]
}
```

**Fallback: Use Email Send node (SMTP)**
- Requires Gmail app password
- Less elegant but works without OAuth

---

## Updated Workflow Flow Chart

```
Manual Trigger
    ↓
Query Visit History
    ↓
Query Activities
    ↓
Score Activities
    ↓
Query Restaurants
    ↓
Match Restaurants
    ↓
Format Message (WhatsApp-style)
    ↓
Generate Magic Link ✨ NEW
    ↓
Store Token in Supabase ✨ NEW
    ↓
Store Suggestions in Conversation ✨ NEW
    ↓
Send Email via Gmail ✨ NEW
```

**Total nodes:** 11 (was 7, adding 4)

---

## Success Criteria

**Workflow is successful if:**
- ✅ Magic link generated with 7-day expiration
- ✅ Token stored in Supabase conversation_tokens table
- ✅ Suggestions stored in conversations table
- ✅ Email delivered to david.shein@gmail.com
- ✅ Email contains clickable magic link
- ✅ Magic link opens dashboard with suggestions visible
- ✅ User can chat with Claude about suggestions

---

## Future Enhancements (v2)

- Add email template variations (weather-based)
- Include activity photos in email
- Add "quick actions" (Yes/No buttons in email)
- Multi-recipient support (wife + David)
- SMS fallback if email bounces

---

**Status:** Ready to implement in n8n UI
**Next:** Open n8n workflow editor and add nodes
