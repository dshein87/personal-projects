-- Migration: Convert 1-5 star ratings to binary yes/no ratings (FIXED VERSION)
-- Date: 2025-10-14
-- Fixes: Drops dependent views before column changes

-- ============================================
-- STEP 1: Drop dependent views
-- ============================================

DROP VIEW IF EXISTS recent_visits_with_details CASCADE;

-- ============================================
-- STEP 2: Drop old rating columns
-- ============================================

ALTER TABLE visits
DROP COLUMN IF EXISTS rating_3yo,
DROP COLUMN IF EXISTS rating_5yo,
DROP COLUMN IF EXISTS rating_overall;

-- ============================================
-- STEP 3: Add new binary rating columns
-- ============================================

ALTER TABLE visits
ADD COLUMN liked_by_3yo BOOLEAN,
ADD COLUMN liked_by_5yo BOOLEAN;

-- Note: would_return BOOLEAN already exists, no changes needed

-- ============================================
-- STEP 4: Add helpful comments
-- ============================================

COMMENT ON COLUMN visits.liked_by_3yo IS 'Did the 3-year-old enjoy this activity?';
COMMENT ON COLUMN visits.liked_by_5yo IS 'Did the 5-year-old enjoy this activity?';
COMMENT ON COLUMN visits.would_return IS 'Would the family go again?';

-- ============================================
-- STEP 5: Recreate view with new columns
-- ============================================

CREATE VIEW recent_visits_with_details AS
SELECT
    v.id,
    v.visited_at,
    v.visit_type,
    -- Activity details
    a.name as activity_name,
    a.city as activity_city,
    a.category as activity_category,
    -- Restaurant details
    r.name as restaurant_name,
    r.city as restaurant_city,
    r.cuisine as restaurant_cuisine,
    -- New binary ratings
    v.liked_by_3yo,
    v.liked_by_5yo,
    v.would_return,
    -- Other visit details
    v.notes,
    v.weather,
    v.attendees,
    v.duration_minutes,
    v.created_at
FROM visits v
LEFT JOIN activities a ON v.activity_id = a.id
LEFT JOIN restaurants r ON v.restaurant_id = r.id
ORDER BY v.visited_at DESC
LIMIT 100;

-- ============================================
-- STEP 6: Update avg_rating computation functions
-- ============================================

CREATE OR REPLACE FUNCTION update_activity_rating(p_activity_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE activities
    SET avg_rating = (
        SELECT
            CASE
                WHEN COUNT(*) = 0 THEN NULL
                ELSE ROUND(
                    (COUNT(*) FILTER (WHERE would_return = true)::DECIMAL / COUNT(*)::DECIMAL),
                    2
                )
            END
        FROM visits
        WHERE activity_id = p_activity_id
    ),
    times_visited = (
        SELECT COUNT(*)
        FROM visits
        WHERE activity_id = p_activity_id
    ),
    last_visited_at = (
        SELECT MAX(visited_at)
        FROM visits
        WHERE activity_id = p_activity_id
    )
    WHERE id = p_activity_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_restaurant_rating(p_restaurant_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE restaurants
    SET avg_rating = (
        SELECT
            CASE
                WHEN COUNT(*) = 0 THEN NULL
                ELSE ROUND(
                    (COUNT(*) FILTER (WHERE would_return = true)::DECIMAL / COUNT(*)::DECIMAL),
                    2
                )
            END
        FROM visits
        WHERE restaurant_id = p_restaurant_id
    ),
    times_visited = (
        SELECT COUNT(*)
        FROM visits
        WHERE restaurant_id = p_restaurant_id
    ),
    last_visited_at = (
        SELECT MAX(visited_at)
        FROM visits
        WHERE restaurant_id = p_restaurant_id
    )
    WHERE id = p_restaurant_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 7: Create trigger to auto-update ratings
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_ratings()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.activity_id IS NOT NULL THEN
            PERFORM update_activity_rating(OLD.activity_id);
        END IF;
        IF OLD.restaurant_id IS NOT NULL THEN
            PERFORM update_restaurant_rating(OLD.restaurant_id);
        END IF;
        RETURN OLD;
    ELSE
        IF NEW.activity_id IS NOT NULL THEN
            PERFORM update_activity_rating(NEW.activity_id);
        END IF;
        IF NEW.restaurant_id IS NOT NULL THEN
            PERFORM update_restaurant_rating(NEW.restaurant_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS visits_update_ratings ON visits;
CREATE TRIGGER visits_update_ratings
    AFTER INSERT OR UPDATE OR DELETE ON visits
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_ratings();

-- ============================================
-- Migration Complete
-- ============================================

-- Verify changes:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'visits'
AND column_name IN ('liked_by_3yo', 'liked_by_5yo', 'would_return')
ORDER BY column_name;
