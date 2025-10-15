# n8n Workflow Specification: Weekly Activity Suggestions

**Date:** 2025-10-15
**Status:** Design Complete - Ready for Implementation
**Workflow ID:** `wRRp1fTwNzOHr9rY`
**Project:** Weekly Activity Planner (`XoTYV1MmnDfn9HAv`)

---

## Table of Contents

1. [Overview](#overview)
2. [Workflow Architecture](#workflow-architecture)
3. [Node Specifications](#node-specifications)
4. [Connection Map](#connection-map)
5. [Scoring Algorithm](#scoring-algorithm)
6. [Complete JSON Payload](#complete-json-payload)
7. [Testing Strategy](#testing-strategy)
8. [Implementation Steps](#implementation-steps)

---

## Overview

### Purpose

Automated weekly weekend activity suggestions delivered every Thursday at noon PST. The workflow:
- Queries Supabase for activities and visit history
- Applies 5-component scoring algorithm
- Selects top 3 activities
- Matches dietary-safe restaurants to each activity
- Formats a WhatsApp-ready message

### Schedule

**Trigger:** Thursday at 12:00 PM (noon) Pacific Time
**Cron Expression:** `0 12 * * 4`
**Timezone:** America/Los_Angeles

### Data Flow

```
Schedule Trigger
    ↓
Query Activities (Supabase)
    ↓
Query Visit History (Supabase)
    ↓
Query Restaurants (Supabase)
    ↓
Score Activities (JavaScript)
    ↓
Select Top 3 (JavaScript)
    ↓
Match Restaurants (JavaScript)
    ↓
Format Message (JavaScript)
    ↓
Output (Placeholder/WhatsApp)
```

---

## Workflow Architecture

### Design Philosophy

1. **Data-driven**: All queries pull from Supabase database (single source of truth)
2. **Separation of concerns**: Each node has one clear responsibility
3. **Testable**: Code nodes use pure functions where possible
4. **Maintainable**: Clear variable naming, comments, error handling
5. **Extensible**: Easy to add new scoring factors or restaurant logic

### Node Count: 8 Total

1. Schedule Trigger (n8n-nodes-base.scheduleTrigger)
2. Query Activities (n8n-nodes-base.code)
3. Query Visit History (n8n-nodes-base.code)
4. Query Restaurants (n8n-nodes-base.code)
5. Score Activities (n8n-nodes-base.code)
6. Select Top 3 (n8n-nodes-base.code)
7. Match Restaurants (n8n-nodes-base.code)
8. Format Message (n8n-nodes-base.code)
9. Output Placeholder (n8n-nodes-base.noOp) - will be replaced with WhatsApp

### Why Code Nodes vs HTTP Request?

**Decision:** Use n8n Code nodes with embedded Supabase queries

**Rationale:**
- Self-contained logic (no external MCP server needed)
- Direct Supabase client library access
- Better error handling
- Easier to debug in n8n GUI
- Simpler deployment (no extra services)

---

## Node Specifications

### Node 1: Schedule Trigger

**Type:** `n8n-nodes-base.scheduleTrigger`
**ID:** `schedule-trigger`
**Position:** [250, 300]

**Purpose:** Trigger workflow every Thursday at noon PST

**Parameters:**
```json
{
  "rule": {
    "interval": [
      {
        "field": "cronExpression",
        "expression": "0 12 * * 4"
      }
    ]
  },
  "timezone": "America/Los_Angeles"
}
```

**Output:** Single execution trigger (empty object)

---

### Node 2: Query Activities

**Type:** `n8n-nodes-base.code`
**ID:** `query-activities`
**Position:** [450, 300]

**Purpose:** Fetch all activities suitable for ages 3-5 with metadata

**Code:**
```javascript
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Query activities suitable for kids ages 3-5
const { data: activities, error } = await supabase
  .from('activities')
  .select(`
    id,
    name,
    description,
    city,
    address,
    drive_time_minutes,
    indoor_outdoor,
    category,
    age_min,
    age_max,
    weather_dependent,
    avg_rating,
    times_visited,
    last_visited_at,
    opening_hours,
    cost_estimate,
    url,
    tags
  `)
  .lte('age_min', 3)  // Suitable for 3yo
  .gte('age_max', 5)  // Suitable for 5yo
  .order('name', { ascending: true });

if (error) {
  throw new Error(`Supabase query error: ${error.message}`);
}

// Return activities as array of items
return activities.map(activity => ({ json: activity }));
```

**Environment Variables Required:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Output:** Array of activity objects (~75 items)

---

### Node 3: Query Visit History

**Type:** `n8n-nodes-base.code`
**ID:** `query-visit-history`
**Position:** [650, 300]

**Purpose:** Fetch visit history for novelty scoring

**Code:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Query visit history with activity IDs and ratings
const { data: visits, error } = await supabase
  .from('visits')
  .select(`
    activity_id,
    visited_at,
    rating_overall,
    rating_3yo,
    rating_5yo,
    notes
  `)
  .order('visited_at', { ascending: false });

if (error) {
  throw new Error(`Supabase query error: ${error.message}`);
}

// Create a map of activity_id -> visit data for easy lookup
const visitMap = {};
visits.forEach(visit => {
  if (!visitMap[visit.activity_id]) {
    visitMap[visit.activity_id] = {
      lastVisit: visit.visited_at,
      ratings: [],
      visitCount: 0
    };
  }
  visitMap[visit.activity_id].visitCount++;
  if (visit.rating_overall) {
    visitMap[visit.activity_id].ratings.push({
      overall: visit.rating_overall,
      rating_3yo: visit.rating_3yo,
      rating_5yo: visit.rating_5yo
    });
  }
});

// Return as single item
return [{ json: { visitMap } }];
```

**Output:** Single object with visitMap

---

### Node 4: Query Restaurants

**Type:** `n8n-nodes-base.code`
**ID:** `query-restaurants`
**Position:** [850, 300]

**Purpose:** Fetch dietary-safe restaurants for matching

**Code:**
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Query restaurants that are safe for family dietary restrictions
const { data: restaurants, error } = await supabase
  .from('restaurants')
  .select(`
    id,
    name,
    cuisine,
    city,
    address,
    drive_time_minutes,
    celiac_safe,
    sesame_free_options,
    cashew_free_options,
    flax_free_options,
    avg_rating,
    price_range,
    url,
    phone,
    celiac_notes,
    allergen_notes
  `)
  .eq('celiac_safe', true)           // Wife: celiac
  .eq('sesame_free_options', true)   // Daughter: sesame
  .eq('cashew_free_options', true)   // Daughter: cashew
  .eq('flax_free_options', true)     // Daughter: flax
  .order('avg_rating', { ascending: false, nullsFirst: false });

if (error) {
  throw new Error(`Supabase query error: ${error.message}`);
}

// Return restaurants as array
return restaurants.map(restaurant => ({ json: restaurant }));
```

**Output:** Array of restaurant objects (~25 items)

---

### Node 5: Score Activities

**Type:** `n8n-nodes-base.code`
**ID:** `score-activities`
**Position:** [1050, 300]

**Purpose:** Apply 5-component scoring algorithm to all activities

**Inputs:**
- Activities array (from Node 2)
- Visit history map (from Node 3)

**Code:**
```javascript
// Get inputs from previous nodes
const activities = $input.first().json;  // Node 2 output
const visitData = $input.all()[1].json;  // Node 3 output
const visitMap = visitData.visitMap;

// Get current date for novelty calculation
const now = new Date();

// Score each activity
const scoredActivities = activities.map(activity => {
  // 1. RATING SCORE (40%)
  const avgRating = activity.avg_rating || 3.0;  // Default to 3.0 if no rating
  const ratingScore = (avgRating / 5.0) * 0.4;

  // 2. DRIVE TIME SCORE (20%)
  const driveTime = activity.drive_time_minutes || 30;
  let driveScore;
  if (driveTime <= 30) {
    // Linear scoring within 30 min
    driveScore = ((30 - driveTime) / 30) * 0.2;
  } else {
    // Exponential decay past 30 min
    driveScore = Math.exp(-(driveTime - 30) / 20) * 0.2;
  }

  // 3. NOVELTY SCORE (30%)
  let noveltyScore = 0.3;  // Default: never visited (max novelty)
  const visitInfo = visitMap[activity.id];
  if (visitInfo && visitInfo.lastVisit) {
    const lastVisit = new Date(visitInfo.lastVisit);
    const daysSince = (now - lastVisit) / (1000 * 60 * 60 * 24);
    // Cap at 30 days for full novelty score
    noveltyScore = Math.min(daysSince / 30, 1.0) * 0.3;
  }

  // 4. AGE MATCH SCORE (5%)
  // Already filtered by age, so full score if in range
  const ageMatch = (activity.age_min <= 3 && activity.age_max >= 5);
  const ageScore = ageMatch ? 0.05 : 0;

  // 5. WEATHER SCORE (5%)
  // Prefer outdoor activities (can adjust with weather API later)
  const weatherScore = activity.indoor_outdoor === 'outdoor' ? 0.05 :
                       activity.indoor_outdoor === 'both' ? 0.035 : 0.025;

  // TOTAL SCORE
  const totalScore = ratingScore + driveScore + noveltyScore + ageScore + weatherScore;

  return {
    ...activity,
    score: totalScore,
    scoreBreakdown: {
      rating: ratingScore,
      driveTime: driveScore,
      novelty: noveltyScore,
      ageMatch: ageScore,
      weather: weatherScore
    },
    daysSinceLastVisit: visitInfo ?
      Math.floor((now - new Date(visitInfo.lastVisit)) / (1000 * 60 * 60 * 24)) :
      999
  };
});

// Return scored activities
return scoredActivities.map(activity => ({ json: activity }));
```

**Output:** Array of activities with scores and breakdown

---

### Node 6: Select Top 3

**Type:** `n8n-nodes-base.code`
**ID:** `select-top-3`
**Position:** [1250, 300]

**Purpose:** Select top 3 activities by score with diversity

**Code:**
```javascript
// Get scored activities
const scoredActivities = $input.all();

// Sort by score descending
const sorted = scoredActivities
  .map(item => item.json)
  .sort((a, b) => b.score - a.score);

// Select top 3 with diversity considerations
const selected = [];
const seenCategories = new Set();
const seenCities = new Set();

for (const activity of sorted) {
  if (selected.length >= 3) break;

  // Prefer diversity: different categories and cities
  const categoryWeight = seenCategories.has(activity.category) ? 0.95 : 1.0;
  const cityWeight = seenCities.has(activity.city) ? 0.97 : 1.0;
  const adjustedScore = activity.score * categoryWeight * cityWeight;

  // Add to selection
  selected.push({
    ...activity,
    adjustedScore,
    rank: selected.length + 1
  });

  seenCategories.add(activity.category);
  seenCities.add(activity.city);
}

// Return top 3
return selected.map(activity => ({ json: activity }));
```

**Output:** Array of 3 activities (top recommendations)

---

### Node 7: Match Restaurants

**Type:** `n8n-nodes-base.code`
**ID:** `match-restaurants`
**Position:** [1450, 300]

**Purpose:** Match restaurants to each activity based on proximity

**Inputs:**
- Top 3 activities (from Node 6)
- Restaurants (from Node 4)

**Code:**
```javascript
// Get inputs
const topActivities = $input.all()[0].json;  // Top 3 from Node 6
const restaurantsInput = $input.all()[1];     // Restaurants from Node 4

// Extract restaurants array
const restaurants = Array.isArray(restaurantsInput) ?
  restaurantsInput.map(r => r.json) :
  [restaurantsInput.json];

// Match restaurants to each activity
const activitiesWithRestaurants = topActivities.map(activity => {
  // Find restaurants in same city or within +15 min drive
  const matchedRestaurants = restaurants
    .filter(restaurant => {
      // Same city = best match
      if (restaurant.city === activity.city) return true;

      // Or within reasonable detour (+15 min from activity)
      const detourTime = Math.abs(restaurant.drive_time_minutes - activity.drive_time_minutes);
      return detourTime <= 15;
    })
    .sort((a, b) => {
      // Sort by: same city first, then by rating
      const aCityMatch = a.city === activity.city ? 1 : 0;
      const bCityMatch = b.city === activity.city ? 1 : 0;
      if (aCityMatch !== bCityMatch) return bCityMatch - aCityMatch;

      return (b.avg_rating || 3.0) - (a.avg_rating || 3.0);
    })
    .slice(0, 2);  // Top 2 restaurants per activity

  return {
    ...activity,
    restaurants: matchedRestaurants
  };
});

// Return activities with matched restaurants
return activitiesWithRestaurants.map(activity => ({ json: activity }));
```

**Output:** Array of 3 activities with matched restaurants

---

### Node 8: Format Message

**Type:** `n8n-nodes-base.code`
**ID:** `format-message`
**Position:** [1650, 300]

**Purpose:** Format WhatsApp-ready message with all details

**Code:**
```javascript
// Get activities with restaurants
const activities = $input.all().map(item => item.json);

// Build WhatsApp message
let message = '🎉 *Weekend Activity Suggestions* 🎉\n\n';
message += 'Here are your top 3 activities for this weekend:\n\n';

activities.forEach((activity, index) => {
  // Activity header
  message += `${index + 1}. *${activity.name}* (${activity.city})\n`;

  // Drive time and rating
  message += `   📍 ${activity.drive_time_minutes} min drive`;
  if (activity.avg_rating) {
    message += ` | ⭐ ${activity.avg_rating.toFixed(1)}/5`;
  }
  message += '\n';

  // Description
  if (activity.description) {
    message += `   ${activity.description}\n`;
  }

  // Novelty indicator
  if (activity.daysSinceLastVisit < 999) {
    message += `   🕐 Last visited ${activity.daysSinceLastVisit} days ago\n`;
  } else {
    message += `   ✨ *New activity - never tried!*\n`;
  }

  // Opening hours (if available)
  if (activity.opening_hours && activity.opening_hours.saturday) {
    message += `   🕒 Hours: ${activity.opening_hours.saturday.open} - ${activity.opening_hours.saturday.close}\n`;
  }

  // Cost
  if (activity.cost_estimate) {
    message += `   💰 ${activity.cost_estimate}\n`;
  }

  // Restaurants
  if (activity.restaurants && activity.restaurants.length > 0) {
    message += `   🍽️ *Nearby Dining:*\n`;
    activity.restaurants.forEach(restaurant => {
      message += `      • ${restaurant.name} (${restaurant.cuisine})`;
      if (restaurant.avg_rating) {
        message += ` - ${restaurant.avg_rating.toFixed(1)}⭐`;
      }
      message += '\n';
    });
  }

  // URL
  if (activity.url) {
    message += `   🔗 ${activity.url}\n`;
  }

  message += '\n';
});

message += 'Have a great weekend! 🌟\n\n';
message += '_Reply with feedback to help improve future suggestions._';

// Return formatted message
return [{
  json: {
    message,
    activities: activities.map(a => ({
      id: a.id,
      name: a.name,
      score: a.score
    }))
  }
}];
```

**Output:** Single object with formatted message and activity metadata

---

### Node 9: Output Placeholder

**Type:** `n8n-nodes-base.noOp`
**ID:** `output-placeholder`
**Position:** [1850, 300]

**Purpose:** Placeholder for WhatsApp node (v1) or logging (testing)

**Note:** Will be replaced with WhatsApp Cloud API node when API approved

---

## Connection Map

### Connection Structure

In n8n, connections are defined by node **name** (not ID). The structure is:

```json
{
  "connections": {
    "Source Node Name": {
      "main": [
        [
          {
            "node": "Destination Node Name",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Our Workflow Connections

```json
{
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Query Activities",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query Activities": {
      "main": [
        [
          {
            "node": "Query Visit History",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query Visit History": {
      "main": [
        [
          {
            "node": "Query Restaurants",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query Restaurants": {
      "main": [
        [
          {
            "node": "Score Activities",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Score Activities": {
      "main": [
        [
          {
            "node": "Select Top 3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Select Top 3": {
      "main": [
        [
          {
            "node": "Match Restaurants",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Match Restaurants": {
      "main": [
        [
          {
            "node": "Format Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Message": {
      "main": [
        [
          {
            "node": "Output Placeholder",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### Visual Connection Flow

```
Schedule Trigger (250, 300)
    ↓
Query Activities (450, 300)
    ↓
Query Visit History (650, 300)
    ↓
Query Restaurants (850, 300)
    ↓
Score Activities (1050, 300)
    ↓
Select Top 3 (1250, 300)
    ↓
Match Restaurants (1450, 300)
    ↓
Format Message (1650, 300)
    ↓
Output Placeholder (1850, 300)
```

**Layout:** Horizontal left-to-right, 200px spacing, all at y=300

---

## Scoring Algorithm

### 5-Component Weighted Scoring

**Total Score Range:** 0.0 to 1.0

| Component | Weight | Purpose | Calculation |
|-----------|--------|---------|-------------|
| **Rating** | 40% | Prioritize highly-rated activities | `(avg_rating / 5.0) × 0.4` |
| **Drive Time** | 20% | Prefer closer activities | Linear ≤30min, exponential decay >30min |
| **Novelty** | 30% | Balance new vs. favorites | Days since visit / 30 (capped at 1.0) |
| **Age Match** | 5% | Ensure age-appropriate | Binary: 0.05 if ages 3-5, else 0 |
| **Weather** | 5% | Prefer outdoor in good weather | 0.05 outdoor, 0.035 both, 0.025 indoor |

### Detailed Scoring Logic

#### 1. Rating Score (40%)
```javascript
const ratingScore = (avg_rating / 5.0) * 0.4;
```
- Range: 0.0 to 0.4
- Default: 0.24 (for 3.0 rating if no data)
- Example: 4.8/5 → 0.384

#### 2. Drive Time Score (20%)
```javascript
if (driveTime <= 30) {
  driveScore = ((30 - driveTime) / 30) * 0.2;
} else {
  driveScore = Math.exp(-(driveTime - 30) / 20) * 0.2;
}
```
- Range: 0.0 to 0.2
- 0-30 min: Linear decay (e.g., 8 min → 0.147, 25 min → 0.033)
- 30+ min: Exponential decay (e.g., 45 min → 0.094, 60 min → 0.040)

#### 3. Novelty Score (30%)
```javascript
const daysSince = (now - lastVisit) / (1000 * 60 * 60 * 24);
noveltyScore = Math.min(daysSince / 30, 1.0) * 0.3;
```
- Range: 0.0 to 0.3
- Never visited: 0.3 (full score)
- 7 days ago: 0.07
- 21 days ago: 0.21
- 30+ days ago: 0.3 (capped)

#### 4. Age Match Score (5%)
```javascript
const ageScore = (age_min <= 3 && age_max >= 5) ? 0.05 : 0;
```
- Binary: 0.05 or 0.0
- All activities pre-filtered, so typically 0.05

#### 5. Weather Score (5%)
```javascript
const weatherScore = indoor_outdoor === 'outdoor' ? 0.05 :
                     indoor_outdoor === 'both' ? 0.035 : 0.025;
```
- Outdoor: 0.05
- Both: 0.035
- Indoor: 0.025

### Example Scoring

**Activity: Frog Park**
- Rating: 4.8/5 → 0.384
- Drive: 8 min → 0.147
- Last visit: 21 days → 0.21
- Age match: ✅ → 0.05
- Weather: outdoor → 0.05
- **TOTAL: 0.841** (84.1%)

**Activity: Lawrence Hall of Science**
- Rating: 4.6/5 → 0.368
- Drive: 25 min → 0.033
- Last visit: never → 0.3
- Age match: ✅ → 0.05
- Weather: indoor → 0.025
- **TOTAL: 0.776** (77.6%)

### Diversity Adjustments

After scoring, top candidates are adjusted for diversity:
- **Category penalty:** 5% reduction if category already selected
- **City penalty:** 3% reduction if city already selected

This ensures variety in suggestions (not 3 parks in Oakland).

---

## Complete JSON Payload

### Full Workflow JSON for PUT Request

```json
{
  "name": "Weekly Activity Suggestions",
  "nodes": [
    {
      "id": "schedule-trigger",
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "typeVersion": 1.2,
      "position": [250, 300],
      "parameters": {
        "rule": {
          "interval": [
            {
              "field": "cronExpression",
              "expression": "0 12 * * 4"
            }
          ]
        },
        "timezone": "America/Los_Angeles"
      }
    },
    {
      "id": "query-activities",
      "name": "Query Activities",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [450, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const { createClient } = require('@supabase/supabase-js');\n\nconst supabase = createClient(\n  process.env.SUPABASE_URL,\n  process.env.SUPABASE_SERVICE_ROLE_KEY\n);\n\nconst { data: activities, error } = await supabase\n  .from('activities')\n  .select(`\n    id, name, description, city, address,\n    drive_time_minutes, indoor_outdoor, category,\n    age_min, age_max, weather_dependent,\n    avg_rating, times_visited, last_visited_at,\n    opening_hours, cost_estimate, url, tags\n  `)\n  .lte('age_min', 3)\n  .gte('age_max', 5)\n  .order('name', { ascending: true });\n\nif (error) throw new Error(`Supabase: ${error.message}`);\n\nreturn activities.map(activity => ({ json: activity }));"
      }
    },
    {
      "id": "query-visit-history",
      "name": "Query Visit History",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const { createClient } = require('@supabase/supabase-js');\n\nconst supabase = createClient(\n  process.env.SUPABASE_URL,\n  process.env.SUPABASE_SERVICE_ROLE_KEY\n);\n\nconst { data: visits, error } = await supabase\n  .from('visits')\n  .select(`activity_id, visited_at, rating_overall, rating_3yo, rating_5yo, notes`)\n  .order('visited_at', { ascending: false });\n\nif (error) throw new Error(`Supabase: ${error.message}`);\n\nconst visitMap = {};\nvisits.forEach(visit => {\n  if (!visitMap[visit.activity_id]) {\n    visitMap[visit.activity_id] = {\n      lastVisit: visit.visited_at,\n      ratings: [],\n      visitCount: 0\n    };\n  }\n  visitMap[visit.activity_id].visitCount++;\n  if (visit.rating_overall) {\n    visitMap[visit.activity_id].ratings.push({\n      overall: visit.rating_overall,\n      rating_3yo: visit.rating_3yo,\n      rating_5yo: visit.rating_5yo\n    });\n  }\n});\n\nreturn [{ json: { visitMap } }];"
      }
    },
    {
      "id": "query-restaurants",
      "name": "Query Restaurants",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [850, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const { createClient } = require('@supabase/supabase-js');\n\nconst supabase = createClient(\n  process.env.SUPABASE_URL,\n  process.env.SUPABASE_SERVICE_ROLE_KEY\n);\n\nconst { data: restaurants, error } = await supabase\n  .from('restaurants')\n  .select(`\n    id, name, cuisine, city, address, drive_time_minutes,\n    celiac_safe, sesame_free_options, cashew_free_options, flax_free_options,\n    avg_rating, price_range, url, phone, celiac_notes, allergen_notes\n  `)\n  .eq('celiac_safe', true)\n  .eq('sesame_free_options', true)\n  .eq('cashew_free_options', true)\n  .eq('flax_free_options', true)\n  .order('avg_rating', { ascending: false, nullsFirst: false });\n\nif (error) throw new Error(`Supabase: ${error.message}`);\n\nreturn restaurants.map(restaurant => ({ json: restaurant }));"
      }
    },
    {
      "id": "score-activities",
      "name": "Score Activities",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1050, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const activities = $input.first().json;\nconst visitData = $input.all()[1].json;\nconst visitMap = visitData.visitMap;\nconst now = new Date();\n\nconst scoredActivities = activities.map(activity => {\n  const avgRating = activity.avg_rating || 3.0;\n  const ratingScore = (avgRating / 5.0) * 0.4;\n\n  const driveTime = activity.drive_time_minutes || 30;\n  let driveScore;\n  if (driveTime <= 30) {\n    driveScore = ((30 - driveTime) / 30) * 0.2;\n  } else {\n    driveScore = Math.exp(-(driveTime - 30) / 20) * 0.2;\n  }\n\n  let noveltyScore = 0.3;\n  const visitInfo = visitMap[activity.id];\n  if (visitInfo && visitInfo.lastVisit) {\n    const lastVisit = new Date(visitInfo.lastVisit);\n    const daysSince = (now - lastVisit) / (1000 * 60 * 60 * 24);\n    noveltyScore = Math.min(daysSince / 30, 1.0) * 0.3;\n  }\n\n  const ageMatch = (activity.age_min <= 3 && activity.age_max >= 5);\n  const ageScore = ageMatch ? 0.05 : 0;\n\n  const weatherScore = activity.indoor_outdoor === 'outdoor' ? 0.05 :\n                       activity.indoor_outdoor === 'both' ? 0.035 : 0.025;\n\n  const totalScore = ratingScore + driveScore + noveltyScore + ageScore + weatherScore;\n\n  return {\n    ...activity,\n    score: totalScore,\n    scoreBreakdown: {\n      rating: ratingScore,\n      driveTime: driveScore,\n      novelty: noveltyScore,\n      ageMatch: ageScore,\n      weather: weatherScore\n    },\n    daysSinceLastVisit: visitInfo ? \n      Math.floor((now - new Date(visitInfo.lastVisit)) / (1000 * 60 * 60 * 24)) : \n      999\n  };\n});\n\nreturn scoredActivities.map(activity => ({ json: activity }));"
      }
    },
    {
      "id": "select-top-3",
      "name": "Select Top 3",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1250, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const scoredActivities = $input.all();\nconst sorted = scoredActivities.map(item => item.json).sort((a, b) => b.score - a.score);\n\nconst selected = [];\nconst seenCategories = new Set();\nconst seenCities = new Set();\n\nfor (const activity of sorted) {\n  if (selected.length >= 3) break;\n  \n  const categoryWeight = seenCategories.has(activity.category) ? 0.95 : 1.0;\n  const cityWeight = seenCities.has(activity.city) ? 0.97 : 1.0;\n  const adjustedScore = activity.score * categoryWeight * cityWeight;\n  \n  selected.push({\n    ...activity,\n    adjustedScore,\n    rank: selected.length + 1\n  });\n  \n  seenCategories.add(activity.category);\n  seenCities.add(activity.city);\n}\n\nreturn selected.map(activity => ({ json: activity }));"
      }
    },
    {
      "id": "match-restaurants",
      "name": "Match Restaurants",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1450, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const topActivities = $input.all()[0].json;\nconst restaurantsInput = $input.all()[1];\nconst restaurants = Array.isArray(restaurantsInput) ? restaurantsInput.map(r => r.json) : [restaurantsInput.json];\n\nconst activitiesWithRestaurants = topActivities.map(activity => {\n  const matchedRestaurants = restaurants\n    .filter(restaurant => {\n      if (restaurant.city === activity.city) return true;\n      const detourTime = Math.abs(restaurant.drive_time_minutes - activity.drive_time_minutes);\n      return detourTime <= 15;\n    })\n    .sort((a, b) => {\n      const aCityMatch = a.city === activity.city ? 1 : 0;\n      const bCityMatch = b.city === activity.city ? 1 : 0;\n      if (aCityMatch !== bCityMatch) return bCityMatch - aCityMatch;\n      return (b.avg_rating || 3.0) - (a.avg_rating || 3.0);\n    })\n    .slice(0, 2);\n  \n  return { ...activity, restaurants: matchedRestaurants };\n});\n\nreturn activitiesWithRestaurants.map(activity => ({ json: activity }));"
      }
    },
    {
      "id": "format-message",
      "name": "Format Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [1650, 300],
      "parameters": {
        "language": "javaScript",
        "jsCode": "const activities = $input.all().map(item => item.json);\n\nlet message = '🎉 *Weekend Activity Suggestions* 🎉\\n\\n';\nmessage += 'Here are your top 3 activities for this weekend:\\n\\n';\n\nactivities.forEach((activity, index) => {\n  message += `${index + 1}. *${activity.name}* (${activity.city})\\n`;\n  message += `   📍 ${activity.drive_time_minutes} min drive`;\n  if (activity.avg_rating) {\n    message += ` | ⭐ ${activity.avg_rating.toFixed(1)}/5`;\n  }\n  message += '\\n';\n  \n  if (activity.description) {\n    message += `   ${activity.description}\\n`;\n  }\n  \n  if (activity.daysSinceLastVisit < 999) {\n    message += `   🕐 Last visited ${activity.daysSinceLastVisit} days ago\\n`;\n  } else {\n    message += `   ✨ *New activity - never tried!*\\n`;\n  }\n  \n  if (activity.opening_hours && activity.opening_hours.saturday) {\n    message += `   🕒 Hours: ${activity.opening_hours.saturday.open} - ${activity.opening_hours.saturday.close}\\n`;\n  }\n  \n  if (activity.cost_estimate) {\n    message += `   💰 ${activity.cost_estimate}\\n`;\n  }\n  \n  if (activity.restaurants && activity.restaurants.length > 0) {\n    message += `   🍽️ *Nearby Dining:*\\n`;\n    activity.restaurants.forEach(restaurant => {\n      message += `      • ${restaurant.name} (${restaurant.cuisine})`;\n      if (restaurant.avg_rating) {\n        message += ` - ${restaurant.avg_rating.toFixed(1)}⭐`;\n      }\n      message += '\\n';\n    });\n  }\n  \n  if (activity.url) {\n    message += `   🔗 ${activity.url}\\n`;\n  }\n  \n  message += '\\n';\n});\n\nmessage += 'Have a great weekend! 🌟\\n\\n';\nmessage += '_Reply with feedback to help improve future suggestions._';\n\nreturn [{ \n  json: { \n    message,\n    activities: activities.map(a => ({\n      id: a.id,\n      name: a.name,\n      score: a.score\n    }))\n  } \n}];"
      }
    },
    {
      "id": "output-placeholder",
      "name": "Output Placeholder",
      "type": "n8n-nodes-base.noOp",
      "typeVersion": 1,
      "position": [1850, 300],
      "parameters": {}
    }
  ],
  "connections": {
    "Schedule Trigger": {
      "main": [
        [
          {
            "node": "Query Activities",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query Activities": {
      "main": [
        [
          {
            "node": "Query Visit History",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query Visit History": {
      "main": [
        [
          {
            "node": "Query Restaurants",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Query Restaurants": {
      "main": [
        [
          {
            "node": "Score Activities",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Score Activities": {
      "main": [
        [
          {
            "node": "Select Top 3",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Select Top 3": {
      "main": [
        [
          {
            "node": "Match Restaurants",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Match Restaurants": {
      "main": [
        [
          {
            "node": "Format Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Message": {
      "main": [
        [
          {
            "node": "Output Placeholder",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  }
}
```

---

## Testing Strategy

### Phase 1: Component Testing

**Test each node independently in n8n GUI:**

1. **Query Activities**
   - Verify returns ~75 activities
   - Check age filtering (age_min ≤ 3, age_max ≥ 5)
   - Validate all expected fields present

2. **Query Visit History**
   - Verify visitMap structure
   - Check lastVisit dates are correct
   - Validate visit counts

3. **Query Restaurants**
   - Verify all dietary filters applied
   - Check returns ~25 restaurants
   - Validate celiac/allergen flags

4. **Score Activities**
   - Verify score range (0.0 to 1.0)
   - Check scoreBreakdown has all 5 components
   - Validate daysSinceLastVisit calculation

5. **Select Top 3**
   - Verify exactly 3 activities returned
   - Check diversity (different categories/cities if possible)
   - Validate rank field (1, 2, 3)

6. **Match Restaurants**
   - Verify 0-2 restaurants per activity
   - Check same-city matches prioritized
   - Validate detour logic (≤15 min)

7. **Format Message**
   - Verify WhatsApp formatting (markdown)
   - Check all fields included
   - Validate emoji rendering

### Phase 2: Integration Testing

**Test full workflow end-to-end:**

1. **Replace Schedule Trigger with Manual Trigger**
   - Change type: `n8n-nodes-base.manualTrigger`
   - Keep all other nodes identical
   - Allows manual execution for testing

2. **Run Full Workflow**
   - Click "Execute Workflow" in n8n GUI
   - Monitor each node's output
   - Check for errors or unexpected data

3. **Verify Output Message**
   - Contains 3 activities
   - All activities age-appropriate
   - Restaurants matched correctly
   - Message format is WhatsApp-compatible

4. **Check Data Quality**
   - Scores make sense (high-rated, close activities score higher)
   - Novelty working (never-visited activities boosted)
   - Diversity present (not 3 identical suggestions)

### Phase 3: Schedule Testing

**Test with actual schedule:**

1. **Set Short Test Schedule**
   - Temporarily change cron to run in 5 minutes
   - Example: If it's 2:35 PM, set to `40 14 * * *` (2:40 PM today)

2. **Wait for Execution**
   - Check n8n executions tab
   - Verify workflow ran automatically
   - Review execution logs

3. **Restore Production Schedule**
   - Change back to `0 12 * * 4` (Thursday noon)
   - Activate workflow

### Testing Checklist

- [ ] All 9 nodes compile without errors
- [ ] Supabase queries return expected data
- [ ] Scoring algorithm produces reasonable scores (0.6-0.9 for good activities)
- [ ] Top 3 are truly the best activities
- [ ] Restaurants are dietary-safe and well-matched
- [ ] Message format is clean and readable
- [ ] No runtime errors in any node
- [ ] Schedule trigger fires at correct time
- [ ] Full workflow completes in <30 seconds

---

## Implementation Steps

### Step 1: Prepare Environment (5 min)

**Verify environment variables in n8n:**

1. Go to n8n Settings → Environment Variables
2. Confirm these are set:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. If not set, add them from `.env` file

### Step 2: Update Workflow via REST API (10 min)

**Use curl to update existing workflow:**

```bash
cd "/Users/dshein/Personal Projects/projects/weekend-activity-planner"

# Load credentials
export N8N_API_KEY=$(grep "^N8N_API_KEY=" .env | cut -d= -f2)
export N8N_HOST="https://dshein.app.n8n.cloud"
export WORKFLOW_ID="wRRp1fTwNzOHr9rY"

# Update workflow with complete JSON
curl -X PUT "${N8N_HOST}/api/v1/workflows/${WORKFLOW_ID}" \
  -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
  -H "Content-Type: application/json" \
  -d @building/workflow-payload.json

# Save the complete JSON to a file first
```

**Alternative: Copy-paste in n8n GUI**

If REST API is tricky, manually recreate nodes in GUI:
1. Open workflow: https://dshein.app.n8n.cloud/workflow/wRRp1fTwNzOHr9rY
2. Delete existing placeholder nodes
3. Add nodes one by one using "Add Node" button
4. Copy code from this spec into each Code node
5. Connect nodes according to connection map

### Step 3: Component Testing (30 min)

**Test each node:**

1. Replace Schedule Trigger with Manual Trigger temporarily
2. Click "Execute Node" on each node individually
3. Inspect output in right panel
4. Fix any errors or missing data
5. Verify data flows correctly between nodes

### Step 4: Full Workflow Test (15 min)

**Run complete workflow:**

1. With Manual Trigger still in place
2. Click "Execute Workflow" (top right)
3. Watch each node execute in sequence
4. Check final output message
5. Verify message looks good for WhatsApp

### Step 5: Fix Issues (30 min buffer)

**Common issues and solutions:**

**Error: "Cannot find module '@supabase/supabase-js'"**
- Solution: n8n Cloud may not have this package
- Alternative: Use HTTP Request nodes to Supabase REST API

**Error: "process.env.SUPABASE_URL is undefined"**
- Solution: Set environment variables in n8n Settings
- Or hardcode URLs (not recommended for production)

**Error: "visitMap is undefined"**
- Solution: Check node execution order
- Verify connection from "Query Visit History" to "Score Activities"

**Error: "activities.map is not a function"**
- Solution: Check data structure returned from previous node
- May need to adjust array extraction logic

### Step 6: Restore Schedule Trigger (5 min)

**After testing with Manual Trigger:**

1. Delete Manual Trigger node
2. Add Schedule Trigger back
3. Configure cron: `0 12 * * 4`
4. Set timezone: `America/Los_Angeles`
5. Connect to "Query Activities"

### Step 7: Activate Workflow (2 min)

**Make workflow live:**

1. Click "Active" toggle in top-right corner
2. Confirm workflow is active (green indicator)
3. Check n8n project page to verify status

### Step 8: Monitor First Real Execution (Next Thursday)

**On Thursday at noon:**

1. Check n8n Executions tab around 12:05 PM
2. Verify workflow executed successfully
3. Review output message
4. Check for any errors or warnings

---

## Environment Variables Required

### n8n Environment Variables

These must be set in n8n Settings → Environment Variables:

```bash
SUPABASE_URL=https://ohdmrfyyavlkoflbbjsd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Local Environment Variables

These are in `.env` for API management:

```bash
N8N_API_KEY=<your-n8n-api-key>
N8N_HOST=https://dshein.app.n8n.cloud
N8N_PROJECT_ID=XoTYV1MmnDfn9HAv
SUPABASE_URL=https://ohdmrfyyavlkoflbbjsd.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

---

## Success Criteria

**Workflow is successful when:**

✅ All 9 nodes execute without errors
✅ Returns exactly 3 activity suggestions
✅ All activities are age-appropriate (ages 3-5)
✅ Activities are scored reasonably (0.6-0.9 range for good activities)
✅ Top 3 have diversity (different categories/cities when possible)
✅ Each activity has 0-2 matched restaurants
✅ All restaurants are dietary-safe (celiac, sesame, cashew, flax)
✅ Message is formatted correctly for WhatsApp
✅ Workflow completes in <30 seconds
✅ Schedule trigger fires every Thursday at noon PST

---

## Next Workflow: Spotify Sync

After this workflow is complete, next is:

**Spotify Preference Sync** (Sunday 11 PM)
- Query Spotify API for listening history
- Update `artist_preferences` table
- Tag genres and discover similar artists
- Prepare for concert discovery workflow

See `building/PLAN.md` for full roadmap.

---

**Document Status:** Complete - Ready for Implementation
**Last Updated:** 2025-10-15
**Author:** Claude Code
**Reviewed By:** Pending (David)

---

*This specification provides everything needed to implement the Weekly Activity Suggestions workflow via n8n REST API. All node code, connections, and testing strategies are included.*
