# Food Finder MCP Server

**Purpose:** Dietary-safe restaurant recommendations for Weekend Activity Planner

## Tools Provided

### 1. find_restaurants
Search for restaurants with dietary filtering and drive time constraints.

**Parameters:**
- `cuisine_preference` (optional): Filter by cuisine type (mexican, italian, etc.)
- `max_drive_time` (optional, default: 30): Maximum drive time in minutes
- `near_activity_id` (optional): Find restaurants near this activity
- `limit` (optional, default: 5): Number of results to return

**Returns:** Array of restaurants sorted by (rating × drive_decay)

### 2. get_restaurant_details
Get full details for a specific restaurant.

**Parameters:**
- `restaurant_id` (required): UUID of the restaurant

**Returns:** Complete restaurant information including dietary notes, hours, contact

### 3. check_dietary_safety
Explicit safety check for dietary restrictions.

**Parameters:**
- `restaurant_id` (required): UUID of the restaurant

**Returns:** Safety assessment with all allergen checks and recommendations

### 4. match_restaurant_to_activity
Find restaurants near a specific activity.

**Parameters:**
- `activity_id` (required): UUID of the activity
- `max_detour_minutes` (optional, default: 15): Maximum additional drive time

**Returns:** Top 3-5 nearby restaurants sorted by proximity

## Dietary Restrictions (ALWAYS Enforced)

All restaurant queries enforce these restrictions:
- ✅ Celiac safe (gluten-free)
- ✅ Sesame-free options
- ✅ Cashew-free options
- ✅ Flax-free options

## Installation

```bash
npm install
npm run build
```

## Usage

Run as MCP server:
```bash
node dist/index.js
```

Or via Claude Code with `.mcp.json` configuration.

## Security

- UUID validation before all queries
- Query builder only (no raw SQL)
- Error message sanitization
- Environment variable validation

## Development

```bash
npm run dev  # Watch mode
npm run build  # Production build
```
