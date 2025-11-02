# n8n Comprehensive Reference Guide

**Generated:** 2025-10-15
**Source:** Context7 MCP + n8n Official Documentation
**Purpose:** Complete reference for building Weekend Activity Planner workflows

---

## Table of Contents

1. [Supabase Node](#supabase-node)
2. [Code Node](#code-node)
3. [Schedule Trigger](#schedule-trigger)
4. [Workflow Structure & Best Practices](#workflow-structure--best-practices)
5. [Quick Reference](#quick-reference)

---

## Supabase Node

### Overview

The Supabase node allows direct integration with Supabase databases, supporting CRUD operations and advanced querying.

### Authentication

**Credential Setup:**
- **Type:** `supabaseApi`
- **Required Fields:**
  - **Host URL:** Your Supabase project URL (e.g., `https://xxx.supabase.co`)
  - **Service Role Secret:** For server-side operations (use anon key for client-side)

**Example Credential Configuration:**
```typescript
{
  name: 'supabaseApi',
  displayName: 'Supabase API',
  properties: [
    {
      displayName: 'Host',
      name: 'host',
      type: 'string',
      default: '',
    },
    {
      displayName: 'Service Role Secret',
      name: 'serviceRole',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
    }
  ]
}
```

### Query Operations

#### Row Operations
- **Get Row(s):** Retrieve data with filters
- **Insert:** Add new rows
- **Update:** Modify existing rows
- **Delete:** Remove rows

#### Query Language

**Filtering with Metadata (PostgreSQL JSON operators):**

```javascript
// Basic filter syntax
metadata->>age=gte.21

// Using JSON operators
metadata->>property={comparison-operator}.{comparison-value}
```

**Comparison Operators:**
- `eq` - Equal
- `neq` - Not equal
- `gt` - Greater than
- `gte` - Greater than or equal
- `lt` - Less than
- `lte` - Less than or equal
- `like` - Pattern matching
- `ilike` - Case-insensitive pattern matching
- `in` - Match any value in array
- `is` - Is null/not null

**Example Filters:**
```javascript
// Age greater than or equal to 21
metadata->>age=gte.21

// Status equals "active"
metadata->>status=eq.active

// Name contains "Smith"
name=ilike.*Smith*
```

### Best Practices

1. **Use Service Role Key for server-side operations** (like n8n workflows)
2. **Filter at database level** rather than in Code nodes
3. **Use RLS (Row Level Security)** policies for multi-tenant scenarios
4. **Index frequently queried fields** for performance

### Common Patterns

**Query with Multiple Filters:**
```javascript
// In Supabase node "Filters" parameter
age=gte.18&age=lte.65&status=eq.active
```

**Select Specific Columns:**
```javascript
// In "Return Fields" parameter
id,name,email,created_at
```

**Order Results:**
```javascript
// In "Sort" parameter
created_at.desc,name.asc
```

**Limit Results:**
```javascript
// In "Limit" parameter
10
```

---

## Code Node

### JavaScript Execution Environment

**Runtime:** Node.js sandbox with restricted access
**Language Support:** JavaScript (ES6+) and Python

### Available Built-in Variables

#### JavaScript

**Core Variables:**
```javascript
$input           // Current node input data
$json            // Current item's JSON data
$binary          // Current item's binary data
$item            // Current item being processed
$items           // All input items
$node            // Current node metadata
$workflow        // Workflow metadata
$execution       // Execution metadata
$now             // Current timestamp (Luxon DateTime)
$today           // Current date (Luxon DateTime)
$vars            // Custom variables
$parameter       // Node parameter values
```

**Accessing Previous Nodes:**
```javascript
// Get all items from a specific node
$("NodeName").all()

// Get first item
$("NodeName").first()

// Get last item
$("NodeName").last()

// Get specific item by index
$("NodeName").all()[0]

// Get linked item (item linking)
$("NodeName").item

// Get node parameters
$("NodeName").params

// Check if node executed
$("NodeName").isExecuted
```

#### Python

**Core Variables:**
```python
_input           # Current node input data
_json            # Current item's JSON data
_binary          # Current item's binary data
_item            # Current item being processed
_items           # All input items
_node            # Current node metadata
_workflow        # Workflow metadata
_execution       # Execution metadata
_now             # Current timestamp
_today           # Current date
_vars            # Custom variables
```

**Accessing Previous Nodes:**
```python
# Get all items from a specific node
_("NodeName").all()

# Get first item
_("NodeName").first()

# Get linked item
_("NodeName").item

# Check if node executed
_("NodeName").isExecuted
```

### Built-in Libraries

**JavaScript:**
```javascript
// Automatically available (no require needed):
// - lodash (_)
// - luxon (DateTime)
// - moment

// Require-able modules (if allowed by NODE_FUNCTION_ALLOW_BUILTIN):
const crypto = require('crypto');
const fs = require('fs');        // If allowed
```

**Python:**
```python
# Built-in modules available:
import json
import datetime
import math
import re

# External modules (if configured):
import numpy      # If allowed
import pandas     # If allowed
```

### Enabling External Modules

**Environment Variables:**
```bash
# Allow all built-in Node.js modules
export NODE_FUNCTION_ALLOW_BUILTIN=*

# Allow specific built-in modules
export NODE_FUNCTION_ALLOW_BUILTIN=crypto,fs

# Allow external npm packages
export NODE_FUNCTION_ALLOW_EXTERNAL=moment,lodash,uuid
```

**For Task Runners (Docker):**
```json
{
  "task-runners": [
    {
      "runner-type": "javascript",
      "env-overrides": {
        "NODE_FUNCTION_ALLOW_BUILTIN": "crypto",
        "NODE_FUNCTION_ALLOW_EXTERNAL": "moment,uuid"
      }
    },
    {
      "runner-type": "python",
      "env-overrides": {
        "N8N_RUNNERS_STDLIB_ALLOW": "json,datetime",
        "N8N_RUNNERS_EXTERNAL_ALLOW": "numpy,pandas"
      }
    }
  ]
}
```

### Data Access Patterns

#### Getting Input Data

**JavaScript:**
```javascript
// Get all input items
let items = $input.all();

// Get first item's JSON
let data = $input.first().json;

// Iterate through items
for (let i = 0; i < items.length; i++) {
  console.log(items[i].json);
}
```

**Python:**
```python
# Get all input items
items = _input.all()

# Get first item's JSON
data = _input.first().json

# Convert JsProxy to Python dict
itemDict = items[0].json.to_py()
```

#### Accessing Data from Previous Nodes

**JavaScript:**
```javascript
// Get data from "HTTP Request" node
let apiData = $("HTTP Request").all();

// Get specific field from previous node
let email = $("Set").first().json.email;

// Iterate through all items from a node
let previousNodeData = $("IF").all();
for(let i=0; i < previousNodeData.length; i++) {
  console.log(previousNodeData[i].json);
}
```

**Python:**
```python
# Get data from previous node
previousNodeData = _("HTTP Request").all()

# Convert JsProxy objects to Python dicts
for item in previousNodeData:
    itemDict = item.json.to_py()
    print(itemDict)
```

### Output Data Structure

**CRITICAL:** All Code node output MUST follow this structure:

**JavaScript:**
```javascript
// Correct format
return [
  {
    json: {
      // Your data here
      name: "Alice",
      age: 30
    }
  },
  {
    json: {
      name: "Bob",
      age: 25
    }
  }
];

// WRONG - will cause errors
return [
  {
    json: [
      // Arrays not allowed as json value
    ]
  }
];

// WRONG - not wrapped in array of objects
return {
  name: "Alice",
  age: 30
};
```

**Python:**
```python
# Correct format
return [
  {
    "json": {
      "name": "Alice",
      "age": 30
    }
  },
  {
    "json": {
      "name": "Bob",
      "age": 25
    }
  }
]
```

### Working with Dates (Luxon)

**JavaScript:**
```javascript
// Current timestamp
let now = $now;
// Displays as: 2025-10-15T14:02:37.065+00:00

// Current date
let today = $today;

// Date arithmetic
let weekAgo = $today.minus(7, 'days');
let nextWeek = $today.plus(7, 'days');

// Date difference
let end = DateTime.fromISO('2025-03-13');
let start = DateTime.fromISO('2025-02-13');
let diffInMonths = end.diff(start, 'months');

// Format dates
let formatted = $now.toFormat('yyyy-MM-dd HH:mm:ss');
```

**Python:**
```python
# Current timestamp
now = _now

# Current date
today = _today

# Date arithmetic (using datetime module)
from datetime import datetime, timedelta
week_ago = datetime.now() - timedelta(days=7)
```

### Static Data (Persistent Storage)

**JavaScript:**
```javascript
// Global static data (accessible by all nodes)
const workflowStaticData = $getWorkflowStaticData('global');

// Access data
const lastExecution = workflowStaticData.lastExecution;

// Update data
workflowStaticData.lastExecution = new Date().getTime();

// Delete data
delete workflowStaticData.lastExecution;

// Node-specific static data (only accessible by this node)
const nodeStaticData = $getWorkflowStaticData('node');
nodeStaticData.counter = (nodeStaticData.counter || 0) + 1;
```

**Python:**
```python
# Global static data
workflowStaticData = _getWorkflowStaticData('global')

# Update data
workflowStaticData.lastExecution = datetime.now().timestamp()
```

### Custom Execution Data

**JavaScript:**
```javascript
// Set custom execution data (for filtering executions later)
$execution.customData.set("key", "value");

// Set multiple values
$execution.customData.setAll({
  "key1": "value1",
  "key2": "value2"
});

// Get custom data
let customData = $execution.customData.getAll();
let specificValue = $execution.customData.get("key");
```

### Common Patterns

#### Transform Data
```javascript
// Map array to new structure
let items = $input.all();
return items.map(item => ({
  json: {
    id: item.json.userId,
    name: item.json.fullName.toUpperCase(),
    email: item.json.contacts.email
  }
}));
```

#### Filter Data
```javascript
// Filter items based on condition
let items = $input.all();
let filtered = items.filter(item => item.json.age >= 18);
return filtered;
```

#### Aggregate Data
```javascript
// Calculate totals
let items = $input.all();
let total = items.reduce((sum, item) => sum + item.json.price, 0);

return [{
  json: {
    totalItems: items.length,
    totalPrice: total,
    averagePrice: total / items.length
  }
}];
```

#### Add New Fields
```javascript
// Add computed fields
let items = $input.all();
items[0].json.workEmail = items[0].json.email['work'];
items[0].json.fullName = `${items[0].json.firstName} ${items[0].json.lastName}`;
return items;
```

### Error Handling

```javascript
// Check if previous node executed
if ($("HTTP Request").isExecuted) {
  let data = $("HTTP Request").first().json;
  // Process data
} else {
  console.log("HTTP Request node did not execute");
}

// Try-catch for error handling
try {
  let result = someDangerousOperation();
  return [{ json: { result } }];
} catch (error) {
  console.log("Error:", error.message);
  return [{ json: { error: error.message } }];
}
```

### Debugging

```javascript
// Output to browser console (not visible in n8n UI)
console.log("Debug info:", $json);

// Return debug data
return [{
  json: {
    debug: {
      inputLength: $input.all().length,
      firstItem: $input.first().json,
      nodeParams: $node
    }
  }
}];
```

### Common Issues

**Issue 1: ES Modules not supported**
```javascript
// ❌ WRONG - ES module syntax not supported
import express from "express";

// ✅ CORRECT - Use CommonJS
const express = require("express");
```

**Issue 2: Incorrect output format**
```javascript
// ❌ WRONG - json must be an object, not array
return [{
  json: [1, 2, 3]  // Will error
}];

// ✅ CORRECT - wrap array in object
return [{
  json: {
    values: [1, 2, 3]
  }
}];
```

**Issue 3: Python JsProxy objects**
```python
# ❌ WRONG - JsProxy not directly usable
items = _("NodeName").all()
print(items[0].json)  # Won't display correctly

# ✅ CORRECT - Convert to Python dict
items = _("NodeName").all()
itemDict = items[0].json.to_py()
print(itemDict)
```

---

## Schedule Trigger

### Overview

The Schedule Trigger node starts workflows at specified times using cron expressions.

### Configuration Modes

1. **Intervals** - Simple recurring schedules
2. **Cron Expression** - Advanced scheduling with full cron syntax

### Cron Expression Syntax

**Format:**
```
┌────────────── second (optional, 0-59)
│ ┌──────────── minute (0-59)
│ │ ┌────────── hour (0-23)
│ │ │ ┌──────── day of month (1-31)
│ │ │ │ ┌────── month (1-12)
│ │ │ │ │ ┌──── day of week (0-7, 0 and 7 = Sunday)
│ │ │ │ │ │
│ │ │ │ │ │
* * * * * *
```

**Fields:**
- **Minute:** 0-59
- **Hour:** 0-23 (24-hour format)
- **Day of Month:** 1-31
- **Month:** 1-12
- **Day of Week:** 0-7 (0 and 7 = Sunday, 1 = Monday)
- **Second (optional):** 0-59

**Special Characters:**
- `*` - Any value
- `,` - List of values (e.g., `1,3,5`)
- `-` - Range of values (e.g., `1-5`)
- `/` - Step values (e.g., `*/5` = every 5)

### Common Schedule Examples

**Hourly:**
```cron
0 * * * *
# Every hour at minute 0
```

**Daily:**
```cron
0 6 * * *
# Every day at 6:00 AM
```

**Weekdays:**
```cron
0 9 * * 1-5
# Monday through Friday at 9:00 AM
```

**Weekly:**
```cron
0 12 * * 1
# Every Monday at 12:00 PM (noon)
```

**Monthly:**
```cron
0 0 1 * *
# First day of every month at midnight
```

**Quarterly:**
```cron
0 0 1 1,4,7,10 *
# First day of Jan, Apr, Jul, Oct at midnight
```

**Every X Minutes:**
```cron
*/5 * * * *
# Every 5 minutes
```

**Every X Hours:**
```cron
0 */3 * * *
# Every 3 hours
```

**Every X Days:**
```cron
0 0 */3 * *
# Every 3 days at midnight
```

**Hourly Range:**
```cron
0 9-17 * * *
# Every hour from 9 AM to 5 PM
```

**Every X Seconds (6-field format):**
```cron
*/10 * * * * *
# Every 10 seconds
```

### Project-Specific Schedules

**Weekly Suggestions (Thursday noon PST):**
```cron
0 12 * * 4
# Every Thursday at 12:00 PM
```

**Spotify Sync (Sunday 11 PM PST):**
```cron
0 23 * * 0
# Every Sunday at 11:00 PM
```

**Concert Discovery (Daily 10 AM PST):**
```cron
0 10 * * *
# Every day at 10:00 AM
```

**Event Discovery (Daily 2 PM PST):**
```cron
0 14 * * *
# Every day at 2:00 PM (14:00)
```

**Feedback Collection (Monday 8 PM PST):**
```cron
0 20 * * 1
# Every Monday at 8:00 PM (20:00)
```

**Ticket Reminders (Daily 6 PM PST):**
```cron
0 18 * * *
# Every day at 6:00 PM (18:00)
```

### Timezone Configuration

**Setting Instance Timezone:**

**Environment Variable:**
```bash
export GENERIC_TIMEZONE=America/Los_Angeles

# Or in Docker
docker run -e GENERIC_TIMEZONE="America/Los_Angeles" n8nio/n8n
```

**Important Notes:**
1. n8n uses the server's timezone by default
2. Set `GENERIC_TIMEZONE` to ensure consistent scheduling
3. For PST/PDT (Oakland, CA): Use `America/Los_Angeles`
4. Cron expressions are interpreted in the configured timezone

### Testing Schedules

**Best Practices:**
1. **Test with manual triggers first** before enabling schedule
2. **Use short intervals for testing** (e.g., `*/5 * * * *` = every 5 min)
3. **Check execution history** to verify timing
4. **Monitor for missed executions** if server was down

### Common Patterns

**Business Hours Only:**
```cron
0 9-17 * * 1-5
# Every hour from 9 AM to 5 PM, Monday-Friday
```

**Weekend Only:**
```cron
0 10 * * 0,6
# Every Saturday and Sunday at 10:00 AM
```

**First Day of Quarter:**
```cron
0 0 1 1,4,7,10 *
# First day of Jan, Apr, Jul, Oct at midnight
```

**Last Day of Month:**
```cron
# Not directly supported - use Code node to check date
0 0 28-31 * *
# Trigger on days 28-31, then check if it's the last day
```

### Debugging Schedule Issues

**Issue 1: Workflow not triggering**
- Verify workflow is **Active** (toggle in UI)
- Check cron expression syntax
- Verify timezone configuration
- Check execution history for errors

**Issue 2: Triggering at wrong time**
- Verify `GENERIC_TIMEZONE` is set correctly
- Remember: 24-hour format (14 = 2 PM)
- Check for DST (Daylight Saving Time) effects

**Issue 3: Missed executions**
- n8n doesn't backfill missed triggers
- Ensure n8n instance stays running
- Consider using external monitoring

---

## Workflow Structure & Best Practices

### Node Organization

**Recommended Structure:**
```
[Trigger] → [Data Source] → [Transform] → [Filter] → [Action] → [Response]
```

**Example:**
```
Schedule Trigger
  ↓
Supabase (query activities)
  ↓
Code (calculate scores)
  ↓
IF (filter by rating)
  ↓ (true)    ↓ (false)
Discord    Log to file
```

### Error Handling

#### Error Workflow Pattern

**Setup:**
1. Create a separate "Error Handler" workflow
2. Use **Error Trigger** node as first node
3. Configure error notifications (Slack, Discord, email)

**Example Error Workflow:**
```json
{
  "nodes": [
    {
      "name": "Error Trigger",
      "type": "n8n-nodes-base.errorTrigger",
      "typeVersion": 1,
      "position": [250, 300]
    },
    {
      "name": "Slack",
      "type": "n8n-nodes-base.slack",
      "typeVersion": 1,
      "position": [450, 300],
      "parameters": {
        "channel": "#alerts",
        "text": "=Workflow {{$node[\"Error Trigger\"].json[\"workflow\"][\"name\"]}} failed.\nError: {{$node[\"Error Trigger\"].json[\"execution\"][\"error\"][\"message\"]}}\nURL: {{$node[\"Error Trigger\"].json[\"execution\"][\"url\"]}}"
      }
    }
  ]
}
```

**Error Trigger Data Structure:**
```json
{
  "execution": {
    "id": "231",
    "url": "https://n8n.example.com/execution/231",
    "error": {
      "message": "Example Error Message",
      "stack": "Stacktrace"
    },
    "lastNodeExecuted": "Node With Error",
    "mode": "manual"
  },
  "workflow": {
    "id": "1",
    "name": "Example Workflow"
  }
}
```

#### Node-Level Error Handling

**Continue on Fail:**
```javascript
// In Code node with "Continue on Fail" enabled
for (let i = 0; i < items.length; i++) {
  try {
    // Process item
    const result = await processItem(items[i]);
    returnData.push(result);
  } catch (error) {
    // Error logged, workflow continues
    returnData.push({
      json: {
        error: error.message,
        originalData: items[i].json
      },
      pairedItem: { item: i }
    });
  }
}
```

### Credential Management

**Best Practices:**
1. **Never hardcode credentials** in workflow JSON
2. **Use credential store** for API keys
3. **Limit credential access** to specific node types
4. **Regular rotation** of API keys
5. **Use environment variables** for sensitive config

**Credential Overwrites (for embedding):**

**Environment Setup:**
```bash
# Set custom endpoint
export CREDENTIALS_OVERWRITE_ENDPOINT=send-credentials

# Optional: Require auth token
export CREDENTIALS_OVERWRITE_ENDPOINT_AUTH_TOKEN=secure-token-here
```

**Send Credentials:**
```bash
curl -X POST "https://n8n.example.com/send-credentials" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer secure-token-here" \
  -d '{
    "supabaseApi": {
      "host": "https://xxx.supabase.co",
      "serviceRole": "[redacted-rotated-use-jwt-signing-key]"
    }
  }'
```

### Workflow Settings

**Essential Settings:**
```json
{
  "settings": {
    "saveExecutionProgress": true,    // Debug execution flow
    "executionTimeout": 120,          // Max 2 minutes (adjust as needed)
    "errorWorkflow": "error-handler-workflow-id",
    "timezone": "America/Los_Angeles"
  }
}
```

**Execution Data:**
- **Save All:** Keep full execution history (uses storage)
- **Save on Error:** Only failed executions (recommended)
- **Don't Save:** Minimal storage, harder to debug

### Node Connections

**Connection Types:**
```javascript
// Main connection (default data flow)
{
  "connections": {
    "Node1": {
      "main": [
        [
          {
            "node": "Node2",
            "type": "main",
            "index": 0  // Main output
          }
        ]
      ]
    }
  }
}

// Multiple outputs (e.g., IF node)
{
  "connections": {
    "IF": {
      "main": [
        [
          {
            "node": "True Branch",
            "type": "main",
            "index": 0  // True output
          }
        ],
        [
          {
            "node": "False Branch",
            "type": "main",
            "index": 0  // False output
          }
        ]
      ]
    }
  }
}
```

### Testing Strategies

**1. Manual Testing:**
- Use "Execute Node" to test individual nodes
- Use "Execute Workflow" for full workflow test
- Pin test data for consistent results

**2. Staging Environment:**
- Duplicate workflows for testing
- Use separate credentials for staging
- Test with production-like data

**3. Monitoring:**
- Set up error workflows
- Monitor execution times
- Track failure rates

### Performance Optimization

**1. Limit Data Processing:**
```javascript
// ❌ BAD - Process all items in memory
let allItems = $input.all();
// ... process thousands of items

// ✅ GOOD - Use pagination/batching
// In Supabase node: Set "Limit" to 100
// Process in batches
```

**2. Avoid Unnecessary Transformations:**
```javascript
// ❌ BAD - Multiple transformation nodes
[Get Data] → [Code: Transform 1] → [Code: Transform 2] → [Code: Transform 3]

// ✅ GOOD - Single transformation
[Get Data] → [Code: All transformations] → [Action]
```

**3. Filter Early:**
```javascript
// ❌ BAD - Get all data then filter
[Supabase: Get All] → [Code: Filter by date]

// ✅ GOOD - Filter at database
[Supabase: Get with date filter] → [Process]
```

### Security Best Practices

1. **Webhook Authentication:**
   - Use Header Auth or Basic Auth for webhooks
   - Rotate tokens regularly
   - Validate incoming data

2. **API Key Protection:**
   - Store in credential store
   - Use environment variables
   - Never log sensitive data

3. **Data Handling:**
   - Don't save sensitive execution data
   - Use data masking for logs
   - Comply with data retention policies

4. **Node Restrictions:**
   - Block dangerous nodes if needed:
     ```bash
     export NODES_EXCLUDE='["n8n-nodes-base.executeCommand","n8n-nodes-base.readWriteFile"]'
     ```

### Workflow Versioning

**Best Practices:**
1. **Export workflows regularly** via REST API
2. **Use version control** (Git) for workflow JSON
3. **Tag versions** with semantic versioning
4. **Document changes** in workflow descriptions

**Export Workflow:**
```bash
curl -X GET "https://n8n.example.com/api/v1/workflows/123" \
  -H "X-N8N-API-KEY: your-api-key" \
  > workflow-v1.2.0.json
```

### Documentation Standards

**Workflow Description Template:**
```markdown
# Workflow Name

**Purpose:** Brief description
**Trigger:** When/how it runs
**Dependencies:** External services, credentials needed
**Outputs:** What it produces
**Error Handling:** How errors are handled
**Last Updated:** YYYY-MM-DD
**Version:** 1.2.0
```

**Node Naming Conventions:**
```
[Action] [Resource] [Detail]

Examples:
- Get Activities From Supabase
- Filter By Drive Time
- Send Discord Notification
- Calculate Activity Score
```

---

## Quick Reference

### Code Node Cheat Sheet

```javascript
// Access input
$input.all()
$input.first()
$input.last()

// Access other nodes
$("NodeName").all()
$("NodeName").first()
$("NodeName").item
$("NodeName").params
$("NodeName").isExecuted

// Built-in objects
$json           // Current item JSON
$binary         // Current item binary
$now            // Current timestamp
$today          // Current date
$vars           // Custom variables
$execution.id   // Execution ID
$workflow.id    // Workflow ID
$workflow.name  // Workflow name

// Static data
$getWorkflowStaticData('global')  // Workflow-wide
$getWorkflowStaticData('node')    // Node-specific

// Output format
return [{
  json: { /* data */ }
}];
```

### Cron Expression Cheat Sheet

```cron
# Every minute
* * * * *

# Every hour
0 * * * *

# Every day at 9 AM
0 9 * * *

# Every weekday at 9 AM
0 9 * * 1-5

# Every Monday at noon
0 12 * * 1

# Every 5 minutes
*/5 * * * *

# Every 3 hours
0 */3 * * *

# First of month
0 0 1 * *

# Quarterly
0 0 1 1,4,7,10 *
```

### Supabase Query Cheat Sheet

```javascript
// Filters
age=gte.18                    // Greater than or equal
status=eq.active              // Equal
name=ilike.*smith*            // Contains (case-insensitive)
age=gte.18&age=lte.65        // Multiple filters

// Select columns
id,name,email,created_at

// Sort
created_at.desc,name.asc

// Limit
10

// Metadata queries
metadata->>age=gte.21
metadata->>status=eq.verified
```

### Common n8n Expressions

```javascript
// Access JSON field
{{ $json.fieldName }}

// Access nested field
{{ $json.user.email }}

// Conditional
{{ $json.age >= 18 ? "adult" : "minor" }}

// Current date/time
{{ $now }}
{{ $today }}

// Date arithmetic
{{ $today.minus(7, 'days') }}
{{ $now.plus(1, 'hour') }}

// Format date
{{ $now.toFormat('yyyy-MM-dd') }}

// String operations
{{ $json.name.toUpperCase() }}
{{ $json.email.toLowerCase() }}

// Array operations
{{ $json.items.length }}
{{ $json.items[0].name }}

// Math operations
{{ $json.price * 1.1 }}
{{ Math.round($json.value) }}

// Check if node executed
{{ $("NodeName").isExecuted }}

// Access previous node data
{{ $("NodeName").first().json.fieldName }}
```

### HTTP Status Codes for Workflows

```
200 OK              - Success
201 Created         - Resource created
204 No Content      - Success, no response body
400 Bad Request     - Invalid input
401 Unauthorized    - Auth failed
403 Forbidden       - No permission
404 Not Found       - Resource not found
429 Too Many        - Rate limited
500 Server Error    - Server-side error
502 Bad Gateway     - Upstream error
503 Unavailable     - Service down
504 Timeout         - Request timeout
```

### Debugging Checklist

- [ ] Node executed? Check green checkmark
- [ ] Input data correct? Check input panel
- [ ] Expression syntax valid? Check {{ }}
- [ ] Previous node executed? Use .isExecuted
- [ ] Credentials valid? Test connection
- [ ] Output format correct? Check array of objects
- [ ] Error logged? Check execution details
- [ ] Timezone correct? Verify GENERIC_TIMEZONE

---

## Project-Specific Implementation Notes

### Weekly Activity Suggestions Workflow

**Schedule:** Thursday noon PST
```cron
0 12 * * 4
```

**Flow:**
1. Schedule Trigger
2. Supabase: Query activities
3. Code: Score activities (novelty, ratings, drive time)
4. Code: Format suggestions
5. WhatsApp: Send message

**Key Logic:**
```javascript
// Drive time decay
const driveTimeScore = Math.exp(-driveTime / 30);

// Novelty bonus
const daysSinceVisit = (now - lastVisit) / (1000 * 60 * 60 * 24);
const noveltyScore = Math.min(daysSinceVisit / 30, 1);

// Combined score
const score = (avgRating / 5) * 0.4 + noveltyScore * 0.3 + driveTimeScore * 0.3;
```

### Dietary Safety Checks

**Always filter restaurants:**
```javascript
// In Supabase node
celiac_safe=eq.true&sesame_free_options=eq.true&cashew_free_options=eq.true&flax_free_options=eq.true
```

### Error Notifications

**Discord/Slack Template:**
```
Workflow {{$node["Error Trigger"].json["workflow"]["name"]}} failed.
Error: {{$node["Error Trigger"].json["execution"]["error"]["message"]}}
Last node: {{$node["Error Trigger"].json["execution"]["lastNodeExecuted"]}}
Check here: {{$node["Error Trigger"].json["execution"]["url"]}}
```

---

## Additional Resources

- **n8n Official Docs:** https://docs.n8n.io
- **n8n API Reference:** https://docs.n8n.io/api/
- **n8n Community:** https://community.n8n.io
- **Cron Expression Tester:** https://crontab.guru
- **Supabase Docs:** https://supabase.com/docs

---

**End of Reference Guide**
