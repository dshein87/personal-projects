# Database Schema & Seed Data

## 📋 Overview

This directory contains the Supabase PostgreSQL database schema and seed data for the Weekend Activity Planner.

**Key principle:** Separation of public facts from private opinions.

---

## 🗄️ Files

### Public Files (Committed to GitHub)

| File | Purpose | Safe for Public |
|------|---------|-----------------|
| `schema.sql` | Complete database schema (10 tables, 5 views, triggers) | ✅ Yes |
| `seed-activities.sql` | ~75 Oakland/East Bay activities (facts only) | ✅ Yes |
| `seed-restaurants.sql` | ~25 celiac-safe restaurants (facts only) | ✅ Yes |
| `migrations/add-personal-annotations.sql` | Migration to add personal_annotations table | ✅ Yes |

### Private Files (NEVER Committed - Gitignored)

| File | Purpose | Contains PII |
|------|---------|--------------|
| `seed-personal-annotations.sql` | Your family's ratings, notes, visit history | ⚠️ YES - Gitignored |

---

## 🏗️ Architecture: Personal Annotations Pattern

### The Problem

Original design mixed **public facts** with **private family data**:

```sql
-- ❌ BAD: Mixes public and private data
INSERT INTO restaurants (name, address, notes)
VALUES ('Tacos Oscar', '4038 Piedmont Ave', 'Sunday night tradition! Kids love it!');
                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                            This is private family data!
```

**Issues:**
- Can't share seed data publicly (contains PII)
- Hard to separate what's safe to commit
- Personal notes exposed in public GitHub repo

### The Solution

**Separate table for ALL personal data:**

```sql
-- ✅ GOOD: Public facts in main table
INSERT INTO restaurants (name, address, cuisine)
VALUES ('Tacos Oscar', '4038 Piedmont Ave', 'Mexican');

-- ✅ GOOD: Private opinions in separate table (gitignored)
INSERT INTO personal_annotations (table_name, record_id, notes, family_rating)
SELECT 'restaurants', id, 'Sunday night tradition! Kids love it!', 5
FROM restaurants WHERE name = 'Tacos Oscar';
```

**Benefits:**
- ✅ Can safely commit public seed data to GitHub
- ✅ Clear separation of facts vs. opinions
- ✅ Personal data never accidentally exposed
- ✅ Works for ALL tables (activities, restaurants, concerts, etc.)

---

## 📊 Schema: personal_annotations Table

### Structure

```sql
CREATE TABLE personal_annotations (
  id UUID PRIMARY KEY,

  -- What this annotation is about
  table_name TEXT NOT NULL,     -- 'restaurants', 'activities', etc.
  record_id UUID NOT NULL,      -- Foreign key to any table

  -- Personal data
  notes TEXT,                   -- "Sunday tradition!", "Kids spilled paint"
  family_rating INTEGER,        -- Overall rating (1-5)
  rating_3yo INTEGER,           -- Younger child's rating
  rating_5yo INTEGER,           -- Older child's rating
  would_return BOOLEAN,         -- Would we go back?
  visit_count INTEGER,          -- How many times visited
  last_visited TIMESTAMPTZ,     -- When we last went
  favorite BOOLEAN,             -- Is this a family favorite?

  -- Flexible metadata
  metadata JSONB,               -- Additional personal data

  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### Helper Views

```sql
-- Join activities with personal annotations
SELECT * FROM activities_with_annotations;

-- Join restaurants with personal annotations
SELECT * FROM restaurants_with_annotations;
```

---

## 🚀 Setup Instructions

### 1. Apply Schema (One Time)

In Supabase SQL Editor:

```sql
-- Run in this order:
-- 1. schema.sql (creates all tables)
-- 2. migrations/add-personal-annotations.sql (adds personal_annotations table)
```

### 2. Load Public Seed Data

```sql
-- Run in this order:
-- 3. seed-activities.sql (~75 activities)
-- 4. seed-restaurants.sql (~25 restaurants)
```

### 3. Load Personal Data (Local Only)

```sql
-- 5. seed-personal-annotations.sql
-- ⚠️ This file is gitignored - only exists on your machine
```

---

## 🔒 Security Best Practices

### What Goes in Public Seed Files

**✅ Safe to commit:**
- Venue names ("Tacos Oscar", "Frog Park")
- Addresses and coordinates (public venues)
- Opening hours, prices, phone numbers
- Dietary information (celiac-safe, allergen info)
- Generic descriptions ("Popular taqueria", "Great playground")

**❌ NEVER commit:**
- Personal visit notes ("Sunday night tradition")
- Family ratings or preferences
- Visit counts or history
- Child-specific ratings
- Personal observations ("Kids spilled paint")
- Membership status ("Our membership expired")

### Gitignore Patterns

The following patterns are gitignored:

```bash
# In .gitignore
database/seed-personal-annotations.sql
database/*-personal.sql
database/personal-*.sql
database/private-*.sql
```

### Verification

```bash
# Check that personal file is gitignored
git check-ignore -v database/seed-personal-annotations.sql
# Should output: .gitignore:38:database/seed-personal-annotations.sql

# Verify it won't be committed
git status --porcelain database/seed-personal-annotations.sql
# Should output: (nothing - file is ignored)
```

---

## 📝 Adding New Personal Annotations

### Via SQL (Manual)

```sql
-- Template for new annotations
INSERT INTO personal_annotations (
  table_name,
  record_id,
  notes,
  family_rating,
  rating_3yo,
  rating_5yo,
  visit_count,
  favorite
)
SELECT
  'activities',  -- or 'restaurants'
  id,
  'Your personal notes here',
  4,   -- family_rating (1-5)
  4,   -- rating_3yo
  5,   -- rating_5yo
  3,   -- visit_count
  true -- favorite
FROM activities
WHERE name = 'Venue Name';
```

### Via Rating UI (Recommended)

The Streamlit rating UI (`rating-ui/streamlit_app.py`) automatically saves to `personal_annotations` table:

```bash
cd rating-ui
streamlit run streamlit_app.py
```

---

## 🔄 Querying with Personal Data

### Get Activities with Your Ratings

```sql
-- Use the helper view
SELECT
  name,
  city,
  personal_notes,
  family_rating,
  rating_3yo,
  rating_5yo,
  visit_count,
  is_favorite
FROM activities_with_annotations
WHERE family_rating >= 4
ORDER BY visit_count DESC;
```

### Get Favorite Restaurants

```sql
SELECT
  name,
  cuisine,
  personal_notes,
  family_rating,
  visit_count
FROM restaurants_with_annotations
WHERE is_favorite = true
ORDER BY family_rating DESC;
```

### Find Highly-Rated but Rarely Visited

```sql
SELECT
  name,
  family_rating,
  visit_count,
  personal_notes
FROM activities_with_annotations
WHERE family_rating >= 4
  AND visit_count <= 2
ORDER BY family_rating DESC;
```

---

## 🛠️ MCP Server Integration

MCP servers should query using the views:

```typescript
// In activity-planner MCP server
const { data, error } = await supabase
  .from('activities_with_annotations')
  .select('*')
  .gte('family_rating', 4)
  .order('visit_count', { ascending: false });
```

This automatically includes personal annotations without needing complex JOINs.

---

## 🧪 Testing the Architecture

### 1. Test Schema Applied

```sql
-- Should return 1 row
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'personal_annotations';
```

### 2. Test Views Exist

```sql
-- Should return 2 rows
SELECT COUNT(*) FROM information_schema.views
WHERE table_name IN ('activities_with_annotations', 'restaurants_with_annotations');
```

### 3. Test Personal Data Loads

```sql
-- Should return count of your annotations
SELECT COUNT(*) FROM personal_annotations;

-- Should show your favorites
SELECT * FROM activities_with_annotations WHERE is_favorite = true;
```

### 4. Test Gitignore Working

```bash
# Should show NO output (file is ignored)
git status --porcelain database/seed-personal-annotations.sql
```

---

## 🔄 Backup & Restore

### Backup Personal Data

```sql
-- Export your personal annotations
COPY personal_annotations TO '/tmp/my-personal-data-backup.sql';
```

Or use Supabase dashboard:
1. Go to Table Editor → personal_annotations
2. Click "Export" → "SQL"
3. Save to secure location (NOT in git repo)

### Restore Personal Data

```sql
-- Import from backup
\i /path/to/my-personal-data-backup.sql
```

---

## 📚 Additional Documentation

- **Schema Details:** See `schema.sql` for full table definitions
- **Migration Guide:** See `migrations/add-personal-annotations.sql`
- **Setup Instructions:** See `../docs/SETUP.md`
- **API Reference:** See `../building/API-REFERENCE.md`

---

## ❓ FAQ

### Q: Can I share the public seed files?

**A:** Yes! `seed-activities.sql` and `seed-restaurants.sql` contain only public venue information. Safe to commit to GitHub or share with others.

### Q: What if I accidentally committed personal data?

**A:**
1. Remove from current files
2. Add to `seed-personal-annotations.sql` (gitignored)
3. Commit the cleaned files
4. ⚠️ Note: Git history still contains old data - consider rotating any exposed secrets

### Q: Can I have multiple personal_annotations for the same venue?

**A:** No - there's a UNIQUE constraint on `(table_name, record_id)`. This ensures one annotation per venue. Update the existing annotation instead.

### Q: How do I delete a personal annotation?

```sql
DELETE FROM personal_annotations
WHERE table_name = 'activities'
  AND record_id = (SELECT id FROM activities WHERE name = 'Venue Name');
```

### Q: What goes in the `metadata` JSONB field?

**A:** Any personal data that doesn't fit standard columns:

```sql
metadata: {
  "typical_spend": 45,
  "parking_notes": "always easy",
  "combo_activity": "swim lesson",
  "bring": "old clothes"
}
```

---

**Last Updated:** 2025-11-13
**Architecture:** Personal Annotations Pattern (Option 2)
**Status:** Production-ready
