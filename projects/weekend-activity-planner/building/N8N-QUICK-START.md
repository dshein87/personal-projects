# n8n Quick Start Guide

**For:** Weekend Activity Planner Project
**Last Updated:** 2025-10-15

---

## Essential Patterns for Our Workflows

### 1. Schedule Trigger Setup

**Thursday noon PST (Weekly Suggestions):**
```json
{
  "name": "Schedule Trigger",
  "type": "n8n-nodes-base.scheduleTrigger",
  "parameters": {
    "rule": {
      "interval": [
        {
          "field": "cronExpression",
          "expression": "0 12 * * 4"
        }
      ]
    }
  }
}
```

**Set timezone in environment:**
```bash
export GENERIC_TIMEZONE=America/Los_Angeles
```

---

### 2. Supabase Query for Activities

**Filter by age and dietary restrictions:**
```json
{
  "name": "Get Activities",
  "type": "n8n-nodes-base.supabase",
  "parameters": {
    "operation": "getAll",
    "tableId": "activities",
    "returnAll": false,
    "limit": 50,
    "filterType": "string",
    "filterString": "age_min=lte.3&age_max=gte.5&drive_time_minutes=lte.60"
  }
}
```

**Common filters:**
```
age_min=lte.3&age_max=gte.5           # Age appropriate (3-5 yo)
drive_time_minutes=lte.30             # Within 30 minutes
indoor_outdoor=eq.outdoor             # Outdoor only
avg_rating=gte.4                      # Highly rated
celiac_safe=eq.true                   # Safe for celiac
```

---

### 3. Code Node for Scoring Logic

**Calculate activity scores:**
```javascript
// Get input items
let activities = $input.all();
let now = $now.toMillis();

// Process each activity
let scored = activities.map(item => {
  let activity = item.json;

  // Drive time decay (exponential past 30 min)
  let driveTimeScore = Math.exp(-activity.drive_time_minutes / 30);

  // Novelty (days since last visit)
  let daysSinceVisit = activity.last_visit_date
    ? (now - new Date(activity.last_visit_date).getTime()) / (1000 * 60 * 60 * 24)
    : 365;
  let noveltyScore = Math.min(daysSinceVisit / 30, 1);

  // Rating (normalized to 0-1)
  let ratingScore = (activity.avg_rating || 3) / 5;

  // Combined score (weighted average)
  let finalScore = (
    ratingScore * 0.4 +
    noveltyScore * 0.3 +
    driveTimeScore * 0.3
  );

  return {
    json: {
      ...activity,
      score: finalScore,
      noveltyScore,
      driveTimeScore,
      ratingScore
    }
  };
});

// Sort by score descending
scored.sort((a, b) => b.json.score - a.json.score);

// Return top 10
return scored.slice(0, 10);
```

---

### 4. Format Message for WhatsApp

**Create user-friendly suggestions:**
```javascript
let activities = $input.all();
let message = "🎉 Weekend Activity Suggestions (Thu Oct 15)\n\n";

activities.slice(0, 3).forEach((item, index) => {
  let a = item.json;
  message += `${index + 1}. ${a.name}\n`;
  message += `   📍 ${a.city} (${a.drive_time_minutes} min drive)\n`;
  message += `   ⭐ ${a.avg_rating || 'New'}/5`;

  if (a.last_visit_date) {
    let daysSince = Math.floor((Date.now() - new Date(a.last_visit_date).getTime()) / (1000 * 60 * 60 * 24));
    message += ` • Last visit: ${daysSince} days ago`;
  } else {
    message += ` • 🆕 Never visited!`;
  }

  message += `\n   💡 ${a.description}\n\n`;
});

message += "Reply with a number to get more details!";

return [{
  json: {
    message: message,
    activities: activities.slice(0, 3).map(i => i.json)
  }
}];
```

---

### 5. Restaurant Safety Check

**Always filter by ALL dietary restrictions:**
```javascript
// In Supabase node for restaurants
"filterString": "celiac_safe=eq.true&sesame_free_options=eq.true&cashew_free_options=eq.true&flax_free_options=eq.true&drive_time_minutes=lte.30"
```

**In Code node:**
```javascript
let restaurants = $input.all();

// Double-check safety
let safe = restaurants.filter(item => {
  let r = item.json;
  return r.celiac_safe === true &&
         r.sesame_free_options === true &&
         r.cashew_free_options === true &&
         r.flax_free_options === true;
});

return safe;
```

---

### 6. Error Handling Setup

**Create Error Handler Workflow:**
```json
{
  "name": "Error Handler",
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "name": "Send Alert",
      "type": "n8n-nodes-base.discord",
      "parameters": {
        "text": "=⚠️ Workflow Failed: {{$node['Error Trigger'].json['workflow']['name']}}\n\nError: {{$node['Error Trigger'].json['execution']['error']['message']}}\n\nLast node: {{$node['Error Trigger'].json['execution']['lastNodeExecuted']}}\n\nCheck: {{$node['Error Trigger'].json['execution']['url']}}"
      }
    }
  ]
}
```

---

## Common Gotchas

### 1. Code Node Output Format
```javascript
// ❌ WRONG
return { name: "Alice" };

// ✅ CORRECT
return [{
  json: { name: "Alice" }
}];
```

### 2. Cron Timezone
```cron
# This runs at noon PST/PDT ONLY if GENERIC_TIMEZONE is set
0 12 * * 4

# Without timezone config, it uses server timezone!
```

### 3. Supabase RLS
```javascript
// Use SERVICE_ROLE_KEY in n8n (server-side)
// Not ANON_KEY (that's for client-side)
```

### 4. Date Comparisons
```javascript
// ❌ WRONG - comparing objects
if (date1 > date2)

// ✅ CORRECT - comparing timestamps
if (date1.toMillis() > date2.toMillis())
```

### 5. Accessing Previous Node Data
```javascript
// ❌ WRONG - Will error if node didn't execute
let data = $("HTTP Request").first().json;

// ✅ CORRECT - Check first
if ($("HTTP Request").isExecuted) {
  let data = $("HTTP Request").first().json;
}
```

---

## Testing Checklist

Before activating a workflow:

- [ ] Test with manual trigger first
- [ ] Verify all credentials are saved
- [ ] Check timezone is set correctly
- [ ] Confirm cron expression is correct (use crontab.guru)
- [ ] Test error handling (force an error)
- [ ] Verify output format from Code nodes
- [ ] Check WhatsApp/Discord messages look correct
- [ ] Confirm dietary filters are applied
- [ ] Monitor first scheduled run
- [ ] Set up error notifications

---

## Workflow Template Structure

```json
{
  "name": "Workflow Name",
  "nodes": [
    {
      "id": "unique-id-1",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [{
            "field": "cronExpression",
            "expression": "0 12 * * 4"
          }]
        }
      }
    },
    {
      "id": "unique-id-2",
      "name": "Query Database",
      "type": "n8n-nodes-base.supabase",
      "typeVersion": 1,
      "position": [450, 300],
      "credentials": {
        "supabaseApi": {
          "id": "cred-id",
          "name": "Supabase"
        }
      },
      "parameters": {
        "operation": "getAll",
        "tableId": "activities"
      }
    },
    {
      "id": "unique-id-3",
      "name": "Process Data",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300],
      "parameters": {
        "mode": "runOnceForAllItems",
        "jsCode": "// Your code here\nreturn $input.all();"
      }
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [[{
        "node": "Query Database",
        "type": "main",
        "index": 0
      }]]
    },
    "Query Database": {
      "main": [[{
        "node": "Process Data",
        "type": "main",
        "index": 0
      }]]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

## Quick Reference

### Access Data
```javascript
$input.all()                    // All items from previous node
$("NodeName").first().json      // First item from specific node
$json.fieldName                 // Current item field
$now                           // Current timestamp
$today                         // Current date
```

### Common Filters (Supabase)
```
eq.value          // Equal
neq.value         // Not equal
gt.value          // Greater than
gte.value         // Greater than or equal
lt.value          // Less than
lte.value         // Less than or equal
like.%pattern%    // Pattern match
ilike.%pattern%   // Case-insensitive match
```

### Cron Shortcuts
```cron
0 12 * * 4        # Thursday noon
0 23 * * 0        # Sunday 11 PM
0 10 * * *        # Daily 10 AM
*/5 * * * *       # Every 5 minutes
```

---

**For full details, see:** `building/N8N-COMPREHENSIVE-REFERENCE.md`
