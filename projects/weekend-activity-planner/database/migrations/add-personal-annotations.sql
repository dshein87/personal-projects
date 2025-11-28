-- Migration: Add personal_annotations table
-- Date: 2025-11-13
-- Purpose: Separate public data (facts about venues) from private data (family opinions/visits)
--
-- This migration creates a flexible table for storing ALL personal family data
-- (notes, ratings, visit counts) that should NEVER be committed to public GitHub.
--
-- Apply this in Supabase SQL Editor BEFORE loading seed data.

-- ============================================
-- CREATE PERSONAL_ANNOTATIONS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS personal_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What record this annotation is about
  table_name TEXT NOT NULL,  -- 'restaurants', 'activities', 'concerts', etc.
  record_id UUID NOT NULL,   -- Foreign key to any table

  -- Personal data fields
  notes TEXT,                -- Personal family notes
  family_rating INTEGER,     -- Overall family rating (1-5)
  rating_3yo INTEGER,        -- Younger child's rating (1-5)
  rating_5yo INTEGER,        -- Older child's rating (1-5)
  would_return BOOLEAN,      -- Would we go back?
  visit_count INTEGER DEFAULT 0,  -- How many times visited
  last_visited TIMESTAMPTZ,  -- When we last went
  favorite BOOLEAN DEFAULT false,  -- Is this a family favorite?

  -- Flexible metadata (JSON for future extensibility)
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure one annotation per record
  CONSTRAINT unique_annotation UNIQUE (table_name, record_id)
);

-- ============================================
-- CREATE INDEXES
-- ============================================

-- Fast lookups by table and record
CREATE INDEX idx_annotations_lookup
  ON personal_annotations(table_name, record_id);

-- Find favorites quickly
CREATE INDEX idx_annotations_favorites
  ON personal_annotations(favorite)
  WHERE favorite = true;

-- Find recent visits
CREATE INDEX idx_annotations_last_visited
  ON personal_annotations(last_visited DESC);

-- Search notes (for text search)
CREATE INDEX idx_annotations_notes_search
  ON personal_annotations USING gin(to_tsvector('english', notes));

-- ============================================
-- CREATE TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_personal_annotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_personal_annotations_updated_at
  BEFORE UPDATE ON personal_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_personal_annotations_updated_at();

-- ============================================
-- HELPER VIEWS
-- ============================================

-- View: Activities with personal annotations
CREATE OR REPLACE VIEW activities_with_annotations AS
SELECT
  a.*,
  pa.notes as personal_notes,
  pa.family_rating,
  pa.rating_3yo,
  pa.rating_5yo,
  pa.would_return,
  pa.visit_count,
  pa.last_visited,
  pa.favorite as is_favorite
FROM activities a
LEFT JOIN personal_annotations pa
  ON pa.table_name = 'activities'
  AND pa.record_id = a.id;

-- View: Restaurants with personal annotations
CREATE OR REPLACE VIEW restaurants_with_annotations AS
SELECT
  r.*,
  pa.notes as personal_notes,
  pa.family_rating,
  pa.visit_count,
  pa.last_visited,
  pa.favorite as is_favorite
FROM restaurants r
LEFT JOIN personal_annotations pa
  ON pa.table_name = 'restaurants'
  AND pa.record_id = r.id;

-- ============================================
-- COMMENTS (Documentation)
-- ============================================

COMMENT ON TABLE personal_annotations IS
'Stores ALL personal family data (notes, ratings, visits) separate from public venue facts.
This table should NEVER be committed to GitHub. Seed data goes in database/seed-personal-annotations.sql (gitignored).';

COMMENT ON COLUMN personal_annotations.table_name IS
'Table this annotation refers to: restaurants, activities, concerts, etc.';

COMMENT ON COLUMN personal_annotations.record_id IS
'UUID of the record in the referenced table';

COMMENT ON COLUMN personal_annotations.notes IS
'Personal family notes like "Sunday night tradition!" or "Kids spilled paint everywhere"';

COMMENT ON COLUMN personal_annotations.rating_3yo IS
'How much the 3-year-old enjoyed it (1-5 scale)';

COMMENT ON COLUMN personal_annotations.rating_5yo IS
'How much the 5-year-old enjoyed it (1-5 scale)';

COMMENT ON COLUMN personal_annotations.metadata IS
'Flexible JSONB field for future personal data (e.g., {"typical_spend": 45, "parking_notes": "always easy"})';

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Personal Annotations Migration Complete!';
  RAISE NOTICE '===========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create database/seed-personal-annotations.sql';
  RAISE NOTICE '2. Move personal notes from seed-activities.sql';
  RAISE NOTICE '3. Move personal notes from seed-restaurants.sql';
  RAISE NOTICE '4. Add seed-personal-annotations.sql to .gitignore';
  RAISE NOTICE '5. Clean public seed files of personal data';
  RAISE NOTICE '';
  RAISE NOTICE 'Views created:';
  RAISE NOTICE '- activities_with_annotations';
  RAISE NOTICE '- restaurants_with_annotations';
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
END $$;
