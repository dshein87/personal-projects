-- Migration: Convert 1-5 star ratings to binary yes/no ratings
-- Date: 2025-10-14
-- Rationale: Binary ratings are faster, clearer, and scientifically better for preference data
--
-- Changes:
-- 1. Remove rating_3yo, rating_5yo, rating_overall (INTEGER 1-5)
-- 2. Add liked_by_3yo, liked_by_5yo (BOOLEAN)
-- 3. Keep would_return (already BOOLEAN) as third rating dimension
--
-- New rating model:
-- - Does 3yo like it? (liked_by_3yo)
-- - Does 5yo like it? (liked_by_5yo)
-- - Do you want to go again? (would_return)

-- ============================================
-- STEP 1: Drop old rating columns
-- ============================================

ALTER TABLE visits
DROP COLUMN IF EXISTS rating_3yo,
DROP COLUMN IF EXISTS rating_5yo,
DROP COLUMN IF EXISTS rating_overall;

-- ============================================
-- STEP 2: Add new binary rating columns
-- ============================================

ALTER TABLE visits
ADD COLUMN liked_by_3yo BOOLEAN,
ADD COLUMN liked_by_5yo BOOLEAN;

-- Note: would_return BOOLEAN already exists, no changes needed

-- ============================================
-- STEP 3: Add helpful comments
-- ============================================

COMMENT ON COLUMN visits.liked_by_3yo IS 'Did the 3-year-old enjoy this activity?';
COMMENT ON COLUMN visits.liked_by_5yo IS 'Did the 5-year-old enjoy this activity?';
COMMENT ON COLUMN visits.would_return IS 'Would the family go again?';

-- ============================================
-- STEP 4: Update avg_rating computation
-- ============================================

-- Note: avg_rating in activities/restaurants tables will now represent
-- percentage of visits where would_return = true (0.0 to 1.0 scale)
-- This will be computed via application logic or triggers (Phase 2)

-- For now, add a function that can be called to recompute avg_rating
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

-- Same for restaurants
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
-- STEP 5: Create trigger to auto-update ratings
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
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_name = 'visits'
-- AND column_name IN ('liked_by_3yo', 'liked_by_5yo', 'would_return');
