-- Weekend Activity Planner - Supabase Database Schema
--
-- This schema supports:
-- - Activity and restaurant tracking
-- - Visit history with age-specific ratings
-- - Event and concert discovery
-- - Social graph (friends/family)
-- - Preference learning over time
-- - Spotify integration for concerts

-- ============================================
-- Extensions
-- ============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for location data (optional, for future map features)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- Core Activity Tables
-- ============================================

-- Activities (parks, museums, playgrounds, etc.)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'park', 'museum', 'playground', 'indoor', 'outdoor', 'seasonal', etc.

    -- Location
    address TEXT,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'CA',
    zip_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    drive_time_minutes INTEGER, -- from home (Oakland 94611)

    -- Age appropriateness
    age_min INTEGER DEFAULT 0,
    age_max INTEGER DEFAULT 18,

    -- Logistics
    indoor_outdoor TEXT, -- 'indoor', 'outdoor', 'both'
    weather_dependent BOOLEAN DEFAULT false,
    requires_reservation BOOLEAN DEFAULT false,
    requires_tickets BOOLEAN DEFAULT false,

    -- Hours and cost
    opening_hours JSONB, -- {day: {open: "9:00", close: "17:00"}}
    cost_estimate TEXT, -- 'free', '$', '$$', '$$$'
    cost_per_person DECIMAL(10, 2),

    -- Amenities
    has_parking BOOLEAN DEFAULT true,
    parking_notes TEXT,
    has_bathrooms BOOLEAN DEFAULT true,
    has_food BOOLEAN DEFAULT false,
    stroller_accessible BOOLEAN,

    -- Activity characteristics
    energy_level TEXT, -- 'low', 'medium', 'high'
    messiness_level TEXT, -- 'clean', 'some_mess', 'very_messy'
    tags TEXT[], -- ['creative', 'active', 'educational', etc.]

    -- Metadata
    url TEXT,
    phone TEXT,
    notes TEXT,
    image_url TEXT,

    -- Internal tracking
    times_visited INTEGER DEFAULT 0,
    last_visited_at TIMESTAMP WITH TIME ZONE,
    avg_rating DECIMAL(3, 2),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX idx_activities_category ON activities(category);
CREATE INDEX idx_activities_city ON activities(city);
CREATE INDEX idx_activities_drive_time ON activities(drive_time_minutes);
CREATE INDEX idx_activities_age_range ON activities(age_min, age_max);
CREATE INDEX idx_activities_indoor_outdoor ON activities(indoor_outdoor);
CREATE INDEX idx_activities_tags ON activities USING GIN(tags);

-- ============================================
-- Restaurant Tables
-- ============================================

CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name TEXT NOT NULL,
    cuisine TEXT, -- 'mexican', 'italian', 'american', etc.
    description TEXT,

    -- Location
    address TEXT,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'CA',
    zip_code TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    drive_time_minutes INTEGER,

    -- Dietary restrictions (CRITICAL)
    celiac_safe BOOLEAN DEFAULT false,
    celiac_notes TEXT, -- Details about cross-contamination practices
    sesame_free_options BOOLEAN DEFAULT false,
    cashew_free_options BOOLEAN DEFAULT false,
    flax_free_options BOOLEAN DEFAULT false,
    allergen_notes TEXT,

    -- Kid-friendly features
    kid_friendly BOOLEAN DEFAULT true,
    has_kids_menu BOOLEAN DEFAULT false,
    high_chairs_available BOOLEAN DEFAULT false,

    -- Hours and cost
    opening_hours JSONB,
    price_range TEXT, -- '$', '$$', '$$$', '$$$$'
    avg_meal_cost DECIMAL(10, 2),

    -- Quality metrics
    times_visited INTEGER DEFAULT 0,
    last_visited_at TIMESTAMP WITH TIME ZONE,
    avg_rating DECIMAL(3, 2),

    -- External data
    yelp_url TEXT,
    google_maps_url TEXT,
    phone TEXT,
    website TEXT,

    -- Metadata
    notes TEXT,
    image_url TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine);
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_celiac_safe ON restaurants(celiac_safe);
CREATE INDEX idx_restaurants_drive_time ON restaurants(drive_time_minutes);

-- ============================================
-- Visit History
-- ============================================

CREATE TABLE visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What was visited
    activity_id UUID REFERENCES activities(id),
    restaurant_id UUID REFERENCES restaurants(id),
    visit_type TEXT NOT NULL, -- 'activity' or 'restaurant'

    -- When
    visited_at TIMESTAMP WITH TIME ZONE NOT NULL,

    -- Who went
    attendees TEXT[], -- ['david', 'wife', '3yo', '5yo', 'friend_name']

    -- Age-specific ratings (IMPORTANT - separate for each child)
    rating_3yo INTEGER CHECK (rating_3yo >= 1 AND rating_3yo <= 5),
    rating_5yo INTEGER CHECK (rating_5yo >= 1 AND rating_5yo <= 5),
    rating_overall INTEGER CHECK (rating_overall >= 1 AND rating_overall <= 5),

    -- Qualitative feedback
    notes TEXT,
    what_worked TEXT,
    what_didnt_work TEXT,
    would_return BOOLEAN,

    -- Conditions
    weather TEXT, -- 'sunny', 'cloudy', 'rainy', etc.
    temperature INTEGER,
    day_of_week TEXT,

    -- Metadata
    photos TEXT[], -- URLs to photos
    duration_minutes INTEGER,
    cost_actual DECIMAL(10, 2),

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ensure either activity_id or restaurant_id is set
    CHECK (
        (activity_id IS NOT NULL AND restaurant_id IS NULL) OR
        (activity_id IS NULL AND restaurant_id IS NOT NULL)
    )
);

CREATE INDEX idx_visits_activity ON visits(activity_id);
CREATE INDEX idx_visits_restaurant ON visits(restaurant_id);
CREATE INDEX idx_visits_visited_at ON visits(visited_at DESC);
CREATE INDEX idx_visits_attendees ON visits USING GIN(attendees);

-- ============================================
-- Event Discovery
-- ============================================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Event details
    name TEXT NOT NULL,
    description TEXT,
    category TEXT, -- 'festival', 'performance', 'seasonal', 'workshop', etc.

    -- Location
    venue_name TEXT,
    address TEXT,
    city TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    drive_time_minutes INTEGER,

    -- Timing
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    end_time TIME,

    -- Age appropriateness
    age_min INTEGER,
    age_max INTEGER,

    -- Tickets and cost
    requires_tickets BOOLEAN DEFAULT false,
    tickets_required_by DATE,
    ticket_url TEXT,
    ticket_price DECIMAL(10, 2),
    sold_out BOOLEAN DEFAULT false,

    -- Discovery metadata
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT, -- 'eventbrite', 'mommy_poppins', 'oakland_parks', 'manual'
    source_url TEXT,

    -- Tracking
    notified_at TIMESTAMP WITH TIME ZONE,
    interested BOOLEAN,
    tickets_purchased BOOLEAN DEFAULT false,
    attended BOOLEAN,

    -- Metadata
    image_url TEXT,
    tags TEXT[],

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_events_requires_tickets ON events(requires_tickets);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_discovered_at ON events(discovered_at DESC);

-- ============================================
-- Social Graph (Friends & Family)
-- ============================================

CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Basic info
    name TEXT NOT NULL,
    relationship TEXT, -- 'friend', 'family', 'school_friend', etc.

    -- Contact
    phone TEXT,
    email TEXT,

    -- Family details
    has_kids BOOLEAN DEFAULT false,
    kids_ages INTEGER[],
    kids_names TEXT[],

    -- Tracking
    last_saw_at DATE,
    times_seen INTEGER DEFAULT 0,

    -- Preferences
    preferred_activities TEXT[], -- Activity IDs or types they enjoy
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_people_last_saw_at ON people(last_saw_at DESC);
CREATE INDEX idx_people_has_kids ON people(has_kids);

-- ============================================
-- Preference Learning
-- ============================================

CREATE TABLE preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- What kind of preference
    preference_type TEXT NOT NULL, -- 'activity_category', 'cuisine', 'time_of_day', 'weather', etc.
    preference_key TEXT NOT NULL, -- The specific value (e.g., 'parks', 'mexican', 'morning')

    -- For whom
    person TEXT, -- 'david', 'wife', '3yo', '5yo'

    -- Learned weight
    weight DECIMAL(5, 4) DEFAULT 0.5, -- 0.0 to 1.0, higher = stronger preference
    confidence DECIMAL(5, 4) DEFAULT 0.5, -- How confident we are in this preference

    -- Supporting data
    positive_examples INTEGER DEFAULT 0, -- Times this led to high ratings
    negative_examples INTEGER DEFAULT 0, -- Times this led to low ratings

    -- Context
    context JSONB, -- Additional context (time of year, weather, etc.)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique constraint
    UNIQUE(preference_type, preference_key, person)
);

CREATE INDEX idx_preferences_person ON preferences(person);
CREATE INDEX idx_preferences_type ON preferences(preference_type);
CREATE INDEX idx_preferences_weight ON preferences(weight DESC);

-- ============================================
-- Music & Concert Discovery
-- ============================================

-- Artist preferences from Spotify
CREATE TABLE artist_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User
    user_id TEXT NOT NULL, -- 'david' or 'wife'

    -- Artist details
    artist_name TEXT NOT NULL,
    spotify_artist_id TEXT,
    genres TEXT[],

    -- Listening data
    play_count_short_term INTEGER DEFAULT 0, -- Last 4 weeks
    play_count_medium_term INTEGER DEFAULT 0, -- Last 6 months
    play_count_long_term INTEGER DEFAULT 0, -- All time

    last_played_at TIMESTAMP WITH TIME ZONE,

    -- Spotify metadata
    popularity INTEGER, -- Spotify popularity score (0-100)

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, spotify_artist_id)
);

CREATE INDEX idx_artist_preferences_user ON artist_preferences(user_id);
CREATE INDEX idx_artist_preferences_play_count ON artist_preferences(play_count_medium_term DESC);
CREATE INDEX idx_artist_preferences_last_played ON artist_preferences(last_played_at DESC);

-- Concert venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Venue details
    name TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    state TEXT DEFAULT 'CA',
    address TEXT,

    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    drive_time_minutes INTEGER,

    -- Venue characteristics
    capacity INTEGER,
    venue_type TEXT, -- 'theater', 'club', 'arena', 'outdoor', etc.
    quality_score DECIMAL(3, 2), -- 1.0 to 5.0, based on reputation

    -- Metadata
    url TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_drive_time ON venues(drive_time_minutes);

-- Discovered concerts
CREATE TABLE concerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Concert details
    artist_name TEXT NOT NULL,
    spotify_artist_id TEXT,

    -- Venue
    venue_id UUID REFERENCES venues(id),
    venue_name TEXT NOT NULL, -- Denormalized for convenience

    -- Timing
    event_date DATE NOT NULL,
    event_time TIME,
    doors_time TIME,

    -- Tickets
    ticket_url TEXT,
    ticket_price_min DECIMAL(10, 2),
    ticket_price_max DECIMAL(10, 2),
    tickets_available BOOLEAN DEFAULT true,
    on_sale_date DATE,

    -- Discovery
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source TEXT, -- 'songkick', 'bandsintown', 'ticketmaster', 'manual'
    source_event_id TEXT,

    -- Tracking
    notified_at TIMESTAMP WITH TIME ZONE,
    interested BOOLEAN,
    ticket_purchased BOOLEAN DEFAULT false,
    attended BOOLEAN,

    -- Recommendation score
    relevance_score DECIMAL(5, 4), -- Based on listening history

    -- Metadata
    image_url TEXT,
    notes TEXT,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_concerts_event_date ON concerts(event_date);
CREATE INDEX idx_concerts_artist_name ON concerts(artist_name);
CREATE INDEX idx_concerts_venue ON concerts(venue_id);
CREATE INDEX idx_concerts_discovered_at ON concerts(discovered_at DESC);
CREATE INDEX idx_concerts_relevance_score ON concerts(relevance_score DESC);

-- ============================================
-- System Tables
-- ============================================

-- Track suggestion history
CREATE TABLE suggestion_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- When suggested
    suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suggested_for_date DATE NOT NULL,

    -- What was suggested
    suggestion_data JSONB NOT NULL, -- Full suggestion JSON

    -- Feedback
    user_response TEXT, -- 'accepted', 'declined', 'modified', 'no_response'
    selected_option INTEGER, -- Which of 3 suggestions was chosen (1, 2, or 3)

    -- Actual outcome
    actually_did BOOLEAN,
    feedback_collected BOOLEAN DEFAULT false,

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_suggestion_history_suggested_for ON suggestion_history(suggested_for_date DESC);
CREATE INDEX idx_suggestion_history_suggested_at ON suggestion_history(suggested_at DESC);

-- ============================================
-- Functions and Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_preferences_updated_at BEFORE UPDATE ON preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_artist_preferences_updated_at BEFORE UPDATE ON artist_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_concerts_updated_at BEFORE UPDATE ON concerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Views for Common Queries
-- ============================================

-- Recent visits with full activity details
CREATE VIEW recent_visits_with_details AS
SELECT
    v.*,
    a.name as activity_name,
    a.category as activity_category,
    a.city as activity_city,
    r.name as restaurant_name,
    r.cuisine as restaurant_cuisine
FROM visits v
LEFT JOIN activities a ON v.activity_id = a.id
LEFT JOIN restaurants r ON v.restaurant_id = r.id
ORDER BY v.visited_at DESC;

-- Highly rated activities
CREATE VIEW top_activities AS
SELECT
    *
FROM activities
WHERE times_visited > 0
ORDER BY avg_rating DESC, times_visited DESC;

-- Celiac-safe restaurants
CREATE VIEW celiac_safe_restaurants AS
SELECT * FROM restaurants
WHERE celiac_safe = true
ORDER BY avg_rating DESC, times_visited DESC;

-- Upcoming events requiring tickets
CREATE VIEW upcoming_ticketed_events AS
SELECT * FROM events
WHERE requires_tickets = true
    AND event_date >= CURRENT_DATE
    AND tickets_purchased = false
    AND sold_out = false
ORDER BY tickets_required_by ASC, event_date ASC;

-- Relevant upcoming concerts
CREATE VIEW upcoming_concerts AS
SELECT
    c.*,
    v.name as full_venue_name,
    v.city as venue_city,
    v.drive_time_minutes,
    v.quality_score as venue_quality
FROM concerts c
JOIN venues v ON c.venue_id = v.id
WHERE c.event_date >= CURRENT_DATE
ORDER BY c.relevance_score DESC, c.event_date ASC;

-- ============================================
-- Initial Data
-- ============================================

-- Insert David's home location as a reference point
-- This can be used for distance calculations
INSERT INTO venues (name, city, state, latitude, longitude, drive_time_minutes, venue_type, quality_score) VALUES
('Fox Theater', 'Oakland', 'CA', 37.8081, -122.2712, 10, 'theater', 4.5),
('The Fillmore', 'San Francisco', 'CA', 37.7842, -122.4331, 35, 'venue', 5.0),
('Greek Theatre', 'Berkeley', 'CA', 37.8739, -122.2542, 20, 'outdoor', 4.8),
('The Independent', 'San Francisco', 'CA', 37.7756, -122.4372, 35, 'club', 4.2),
('Warfield', 'San Francisco', 'CA', 37.7822, -122.4101, 35, 'theater', 4.3);

-- ============================================
-- Comments
-- ============================================

COMMENT ON TABLE activities IS 'Parks, museums, playgrounds, and other kid activities';
COMMENT ON TABLE restaurants IS 'Family-friendly restaurants with dietary restriction tracking';
COMMENT ON TABLE visits IS 'Visit history with age-specific ratings for 3yo and 5yo';
COMMENT ON TABLE events IS 'Discovered events from Eventbrite, Mommy Poppins, etc.';
COMMENT ON TABLE people IS 'Friends and family social graph';
COMMENT ON TABLE preferences IS 'Learned preferences for activity recommendations';
COMMENT ON TABLE artist_preferences IS 'Spotify artist listening data for concert discovery';
COMMENT ON TABLE venues IS 'Concert venue information';
COMMENT ON TABLE concerts IS 'Discovered concerts from Songkick, Bandsintown, etc.';
COMMENT ON TABLE suggestion_history IS 'Track which suggestions were made and chosen';

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- For development, RLS is disabled
-- For production with multi-user access, enable RLS and add policies

-- ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Enable read access for all users" ON activities FOR SELECT USING (true);

-- ============================================
-- Schema Complete
-- ============================================

-- Verify installation
DO $$
BEGIN
    RAISE NOTICE 'Weekend Activity Planner schema installed successfully!';
    RAISE NOTICE 'Tables created: activities, restaurants, visits, events, people, preferences, artist_preferences, venues, concerts, suggestion_history';
    RAISE NOTICE 'Views created: recent_visits_with_details, top_activities, celiac_safe_restaurants, upcoming_ticketed_events, upcoming_concerts';
END $$;
