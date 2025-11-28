-- Weekend Activity Planner - Activity Seed Data
-- ~75 Oakland/East Bay activities for kids ages 3-5
--
-- Categories:
-- - Parks & Playgrounds (25)
-- - Museums & Indoor (18)
-- - Outdoor Adventures (17)
-- - Seasonal & Special (15)

-- ============================================
-- PARKS & PLAYGROUNDS (25)
-- ============================================

INSERT INTO activities (name, description, category, address, city, zip_code, latitude, longitude, drive_time_minutes, age_min, age_max, indoor_outdoor, weather_dependent, requires_reservation, requires_tickets, opening_hours, cost_estimate, cost_per_person, has_parking, parking_notes, has_bathrooms, has_food, stroller_accessible, energy_level, messiness_level, tags, url, notes) VALUES

-- Popular parks
('Frog Park (Joaquin Miller Park)', 'Popular park with playground, biking trails, and Saturday farmers market. Great for bikes and scooters.', 'park', '3590 Sanborn Dr', 'Oakland', '94602', 37.8120, -122.1886, 15, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "05:00", "close": "22:00"}}', 'free', 0, true, 'Good parking available', true, false, true, 'high', 'clean', ARRAY['biking', 'playground', 'farmers_market', 'outdoor'], 'https://www.oaklandca.gov/topics/joaquin-miller-park', 'Saturday farmers market from 9am-1pm. Excellent biking trails.'),

('Heather Farms Park', 'Large park with playground, duck pond, swim center. Great for post-swim lesson activities with bikes and scooters.', 'park', '301 N San Carlos Dr', 'Walnut Creek', '94598', 37.9197, -122.0453, 25, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "06:00", "close": "sunset"}}', 'free', 0, true, 'Large parking lot', true, false, true, 'medium', 'clean', ARRAY['playground', 'water', 'biking', 'outdoor'], 'https://www.walnut-creek.org/departments/parks-recreation', 'Popular Walnut Creek park with swimming facilities.'),

('Draquena Quarry Park', 'Scenic park with playground and picnic areas. Part of Oakland park system.', 'park', 'Draquena Ave & Thornhill Dr', 'Oakland', '94611', 37.8387, -122.1964, 10, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Street parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'picnic', 'outdoor'], 'https://www.oaklandca.gov/topics/parks', 'Oakland neighborhood park with playground.'),

('Civic Center Park (Walnut Creek)', 'Downtown Walnut Creek park with playground and splash pad in summer.', 'park', '1375 Civic Dr', 'Walnut Creek', '94596', 37.9067, -122.0611, 28, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "06:00", "close": "22:00"}}', 'free', 0, true, 'Underground parking garage', true, false, true, 'medium', 'clean', ARRAY['playground', 'water', 'downtown'], 'https://www.walnut-creek.org/city-hall/parks-recreation/parks/civic-park', 'Near downtown restaurants and shops.'),

-- Additional great parks in Oakland/East Bay
('Lake Merritt Playground & Park', 'Beautiful lakeside park with large playground, walking paths, and fairy wonderland area.', 'park', '650 Bellevue Ave', 'Oakland', '94610', 37.8103, -122.2520, 12, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "05:00", "close": "22:00"}}', 'free', 0, true, 'Street parking and lots', true, true, true, 'medium', 'clean', ARRAY['playground', 'walking', 'water', 'outdoor'], 'https://www.oaklandca.gov/topics/lake-merritt', 'Great for walks around the lake. Food trucks and snacks available.'),

('Montclair Village Playground', 'Neighborhood playground in Montclair Village, in Oakland area.', 'playground', 'Mountain Blvd & Thornhill Dr', 'Oakland', '94611', 37.8338, -122.2099, 5, 1, 8, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Street parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'neighborhood'], NULL, 'Short drive from Oakland neighborhoods.'),

('Redwood Regional Park', 'Redwood forest with hiking trails, streams, and nature exploration.', 'park', '7867 Redwood Rd', 'Oakland', '94619', 37.8184, -122.1687, 20, 2, 12, 'outdoor', true, false, false, '{"daily": {"open": "05:00", "close": "22:00"}}', 'free', 0, true, 'Parking lots available', true, false, false, 'high', 'some_mess', ARRAY['hiking', 'nature', 'outdoor', 'trees'], 'https://www.ebparks.org/parks/redwood', 'Beautiful redwood groves. Trails vary in difficulty.'),

('Dimond Park', 'Oakland park with playground, rec center, and lots of grass space.', 'park', '3860 Hanly Rd', 'Oakland', '94602', 37.7983, -122.2127, 15, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Good parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'sports', 'outdoor'], 'https://www.oaklandca.gov/locations/dimond-recreation-center', 'Large playground and rec center.'),

('Tilden Park (multiple areas)', 'Massive regional park with steam trains, carousel, Little Farm, playgrounds, Lake Anza, hiking.', 'park', 'Wildcat Canyon Rd', 'Berkeley', '94708', 37.8979, -122.2447, 25, 1, 12, 'outdoor', true, false, false, '{"daily": {"open": "05:00", "close": "22:00"}}', 'free', 0, true, 'Multiple parking areas', true, true, true, 'high', 'some_mess', ARRAY['hiking', 'animals', 'trains', 'nature', 'carousel'], 'https://www.ebparks.org/parks/tilden', 'Can easily spend full day here. Little Farm and steam trains are highlights.'),

('Joaquin Miller Park', 'Large Oakland park with redwood groves, hiking trails, and playgrounds.', 'park', '3590 Sanborn Dr', 'Oakland', '94602', 37.8090, -122.1868, 15, 2, 12, 'outdoor', true, false, false, '{"daily": {"open": "05:00", "close": "22:00"}}', 'free', 0, true, 'Good parking', true, false, false, 'high', 'some_mess', ARRAY['hiking', 'nature', 'playground'], 'https://www.oaklandca.gov/topics/joaquin-miller-park', 'Beautiful trails through redwoods.'),

('Martin Luther King Jr. Regional Shoreline', 'Bay shoreline park with playgrounds, picnic areas, and Ardenwood water park nearby.', 'park', '7600 Oakport St', 'Oakland', '94621', 37.7321, -122.1950, 22, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Large lots', true, false, true, 'medium', 'clean', ARRAY['playground', 'water', 'picnic'], 'https://www.ebparks.org/parks/mlkjr', 'Great views of the bay.'),

('Temescal Regional Park', 'Park with small beach, swimming (summer), playground, and walking trails around lake.', 'park', '6500 Broadway Terrace', 'Oakland', '94618', 37.8372, -122.2290, 12, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "05:00", "close": "22:00"}}', '$', 5, true, 'Parking fee', true, true, true, 'medium', 'some_mess', ARRAY['beach', 'swimming', 'playground', 'water'], 'https://www.ebparks.org/parks/temescal', 'Small beach perfect for young kids. Parking fee required.'),

('Knowland Park', 'Large Oakland park adjacent to Oakland Zoo, with hiking trails.', 'park', '9777 Golf Links Rd', 'Oakland', '94605', 37.7514, -122.1533, 20, 3, 12, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Good parking', false, false, false, 'high', 'some_mess', ARRAY['hiking', 'nature'], 'https://www.oaklandca.gov/topics/knowland-park', 'Nice hiking but limited facilities for young kids.'),

('Hardy Park', 'Oakland neighborhood park with playground and sports fields.', 'park', '851 98th Ave', 'Oakland', '94603', 37.7676, -122.1760, 18, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Street parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'sports'], 'https://www.oaklandca.gov/topics/parks', 'Neighborhood park with nice playground.'),

('Wildwood Park (Piedmont)', 'Boutique playground in Piedmont with unique climbing structures.', 'playground', '380 Wildwood Ave', 'Piedmont', '94611', 37.8233, -122.2315, 8, 2, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Limited street parking', true, false, true, 'high', 'clean', ARRAY['playground', 'climbing'], NULL, 'Small but creative playground structures.'),

('Piedmont Park', 'Piedmont community park with playground, tennis, and pool (summer).', 'park', '711 Highland Ave', 'Piedmont', '94611', 37.8244, -122.2318, 8, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Limited parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'swimming', 'sports'], 'https://www.piedmont.ca.gov/recreation/facilities/piedmont_park', 'Nice neighborhood park. Pool in summer.'),

('Markham Regional Arboretum', 'Peaceful gardens with easy walking paths, perfect for nature exploration.', 'park', 'Discovery Bay Blvd', 'Discovery Bay', '94505', 37.9063, -121.6011, 65, 2, 10, 'outdoor', true, false, false, '{"daily": {"open": "08:00", "close": "sunset"}}', 'free', 0, true, 'Parking available', true, false, true, 'low', 'clean', ARRAY['nature', 'gardens', 'walking'], 'https://www.ebparks.org/parks/markham', 'Farther drive but beautiful gardens.'),

('Shadow Cliffs Regional Park', 'Pleasanton park with swimming beach, playground, and picnic areas.', 'park', '2500 Stanley Blvd', 'Pleasanton', '94566', 37.6764, -121.8698, 45, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "06:00", "close": "sunset"}}', '$', 5, true, 'Parking fee', true, true, true, 'high', 'some_mess', ARRAY['beach', 'swimming', 'playground', 'water'], 'https://www.ebparks.org/parks/shadow-cliffs', 'Great swimming beach for summer. Farther drive.'),

('Memorial Park (Cupertino)', 'Cupertino park with excellent playground and splash pad.', 'park', '1 S Blaney Ave', 'Cupertino', '95014', 37.3181, -121.9960, 75, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "08:00", "close": "sunset"}}', 'free', 0, true, 'Good parking', true, false, true, 'high', 'some_mess', ARRAY['playground', 'water', 'splash_pad'], NULL, 'Excellent playground but long drive from Oakland.'),

('Glen Park (SF)', 'San Francisco neighborhood park with playground and hiking trails.', 'park', 'Bosworth St & Elk St', 'San Francisco', '94131', 37.7362, -122.4343, 40, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Street parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'hiking'], NULL, 'SF park with nice hidden canyon trail.'),

('Crab Cove (Alameda)', 'Bay shoreline park with small beach, visitor center, and tide pools.', 'park', '1252 McKay Ave', 'Alameda', '94501', 37.7648, -122.2717, 20, 2, 10, 'outdoor', true, false, false, '{"wed-sun": {"open": "10:00", "close": "17:00"}}', 'free', 0, true, 'Parking lot', true, false, true, 'low', 'some_mess', ARRAY['beach', 'nature', 'educational', 'water'], 'https://www.ebparks.org/parks/crab_cove', 'Great for tide pool exploration. Visitor center has exhibits.'),

('Crown Beach (Alameda)', 'Long sandy beach with playground, perfect for summer days.', 'park', '8th St & Otis Dr', 'Alameda', '94501', 37.7651, -122.2735, 20, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', '$', 5, true, 'Parking fee', true, true, true, 'medium', 'very_messy', ARRAY['beach', 'playground', 'water'], 'https://www.ebparks.org/parks/crown', 'Best beach for young kids in East Bay. Parking fee.'),

('Berkeley Marina Playground', 'Large adventure playground at the marina with climbing structures and bay views.', 'playground', '201 University Ave', 'Berkeley', '94710', 37.8687, -122.3139, 22, 3, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Large parking lot', true, true, true, 'high', 'clean', ARRAY['playground', 'climbing', 'water_views'], NULL, 'Great playground with bay views. Often windy.'),

('Mills College Campus', 'Beautiful campus perfect for biking around. Safe, car-free paths.', 'outdoor', '5000 MacArthur Blvd', 'Oakland', '94613', 37.7844, -122.1799, 12, 3, 12, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Visitor parking', true, false, true, 'medium', 'clean', ARRAY['biking', 'walking', 'campus'], 'https://www.mills.edu', 'Great for bike rides. Great for bike rides. Safe car-free paths.'),

-- Additional playgrounds
('Mosswood Park', 'Oakland park with playground, rec center, and community pool.', 'park', '3612 Webster St', 'Oakland', '94609', 37.8273, -122.2632, 10, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Street parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'swimming'], 'https://www.oaklandca.gov/locations/mosswood-recreation-center', 'Community pool in summer.');

-- ============================================
-- MUSEUMS & INDOOR ACTIVITIES (18)
-- ============================================

INSERT INTO activities (name, description, category, address, city, zip_code, latitude, longitude, drive_time_minutes, age_min, age_max, indoor_outdoor, weather_dependent, requires_reservation, requires_tickets, opening_hours, cost_estimate, cost_per_person, has_parking, parking_notes, has_bathrooms, has_food, stroller_accessible, energy_level, messiness_level, tags, url, notes) VALUES

-- Unique playgrounds
('Adventure Playground (Berkeley)', 'Unique play space where kids can build, paint, use tools, and get messy. Bring old clothes!', 'playground', '160 University Ave', 'Berkeley', '94710', 37.8691, -122.3133, 20, 3, 12, 'outdoor', true, false, false, '{"wed-sun": {"open": "10:00", "close": "17:00"}}', 'free', 0, true, 'Berkeley Marina parking', true, false, false, 'high', 'very_messy', ARRAY['creative', 'building', 'messy_play', 'tools'], 'https://www.ci.berkeley.ca.us/adventureplayground', 'Unique creative play space. Dress kids in old clothes - they will get paint on them!'),

('Children''s Fairyland (Oakland)', 'Storybook theme park with puppet shows, small rides, and farm animals.', 'amusement', '699 Bellevue Ave', 'Oakland', '94610', 37.8095, -122.2554, 12, 1, 8, 'outdoor', false, false, true, '{"fri-sun": {"open": "10:00", "close": "16:00"}}', '$$', 14, true, 'Lake Merritt parking', true, true, true, 'medium', 'clean', ARRAY['storybook', 'animals', 'shows', 'rides'], 'https://fairyland.org', 'Classic Oakland attraction. Classic Oakland attraction. Annual memberships available.'),

('Oakland Zoo', 'Large zoo with diverse animals, sky ride, and kids'' play area.', 'zoo', '9777 Golf Links Rd', 'Oakland', '94605', 37.7503, -122.1475, 20, 1, 12, 'outdoor', false, false, true, '{"daily": {"open": "10:00", "close": "16:00"}}', '$$', 24, true, 'Large parking lot', true, true, true, 'high', 'clean', ARRAY['animals', 'zoo', 'sky_ride', 'outdoor'], 'https://www.oaklandzoo.org', 'Great for full day trips. Annual memberships available.'),

('Cereal Cinema (various locations)', 'Movie screenings where you eat cereal during the film. Great rainy day activity.', 'cinema', 'Various SF Bay Area Alamo Drafthouse', 'Oakland', '94607', 37.8042, -122.2711, 15, 3, 10, 'indoor', false, true, true, '{"sat-sun": {"open": "10:00", "close": "12:00"}}', '$', 12, true, 'Theater parking', true, true, true, 'low', 'clean', ARRAY['movies', 'indoor', 'rainy_day'], 'https://drafthouse.com/oakland', 'Popular weekend morning activity. Check website schedule for showings.'),

('Lawrence Hall of Science', 'UC Berkeley science museum with hands-on exhibits, planetarium, and outdoor science park.', 'museum', '1 Centennial Dr', 'Berkeley', '94720', 37.8793, -122.2475, 22, 3, 12, 'both', false, false, true, '{"daily": {"open": "10:00", "close": "17:00"}}', '$$', 22, true, 'Parking lot ($10)', true, true, true, 'medium', 'clean', ARRAY['science', 'educational', 'planetarium', 'hands_on'], 'https://www.lawrencehallofscience.org', 'Amazing views of the bay. Great for curious kids.'),

('Chabot Space & Science Center', 'Space and science museum with planetarium, observatory, and hands-on exhibits.', 'museum', '10000 Skyline Blvd', 'Oakland', '94619', 37.8186, -122.1807, 18, 4, 12, 'both', false, false, true, '{"wed-sun": {"open": "10:00", "close": "17:00"}}', '$$', 20, true, 'Free parking', true, true, true, 'medium', 'clean', ARRAY['space', 'science', 'planetarium', 'observatory'], 'https://chabotspace.org', 'Great for space-interested kids. Some exhibits better for older kids.'),

('Bay Area Discovery Museum', 'Hands-on children''s museum in Sausalito under the Golden Gate Bridge.', 'museum', '557 McReynolds Rd', 'Sausalito', '94965', 37.8350, -122.4771, 35, 1, 8, 'both', false, false, true, '{"daily": {"open": "09:00", "close": "17:00"}}', '$$', 20, true, 'Free parking', true, true, true, 'high', 'some_mess', ARRAY['hands_on', 'educational', 'creative', 'outdoor'], 'https://bayareadiscoverymuseum.org', 'Perfect for this age group. Outdoor play areas too.'),

('Children''s Creativity Museum (SF)', 'San Francisco museum focused on creative play, animation, music, and tech.', 'museum', '221 4th St', 'San Francisco', '94103', 37.7825, -122.4041, 35, 3, 12, 'indoor', false, false, true, '{"wed-sun": {"open": "10:00", "close": "16:00"}}', '$$', 17, true, 'Paid parking nearby', true, true, true, 'medium', 'clean', ARRAY['creative', 'technology', 'animation', 'hands_on'], 'https://creativity.org', 'Great for creative, tech-interested kids. In Yerba Buena Gardens.'),

('Oakland Museum of California', 'California history, art, and natural sciences museum with family programs.', 'museum', '1000 Oak St', 'Oakland', '94607', 37.7973, -122.2655, 12, 4, 12, 'indoor', false, false, true, '{"wed-sun": {"open": "11:00", "close": "17:00"}}', '$$', 19, true, 'Parking garage nearby', true, true, true, 'low', 'clean', ARRAY['history', 'art', 'science', 'california'], 'https://museumca.org', 'Free for kids under 5. Better for older kids but has family programs.'),

('Habitot Children''s Museum', 'Hands-on museum in Berkeley designed for young children (under 7).', 'museum', '2065 Kittredge St', 'Berkeley', '94704', 37.8693, -122.2679, 18, 0, 7, 'indoor', false, false, true, '{"wed-mon": {"open": "09:30", "close": "12:30"}}', '$', 14, true, 'Paid parking nearby', true, false, true, 'medium', 'some_mess', ARRAY['hands_on', 'toddler_friendly', 'creative', 'educational'], 'https://habitot.org', 'Perfect age range for your kids! Specifically designed for young children.'),

('California Academy of Sciences', 'San Francisco natural history museum with aquarium, planetarium, and rainforest dome.', 'museum', '55 Music Concourse Dr', 'San Francisco', '94118', 37.7699, -122.4661, 35, 3, 12, 'indoor', false, false, true, '{"daily": {"open": "09:30", "close": "17:00"}}', '$$$', 40, true, 'Music Concourse garage', true, true, true, 'high', 'clean', ARRAY['science', 'aquarium', 'planetarium', 'nature'], 'https://www.calacademy.org', 'Amazing but pricey. Full day experience. Can be crowded.'),

('Exploratorium', 'San Francisco hands-on science museum at Pier 15.', 'museum', 'Pier 15 Embarcadero', 'San Francisco', '94111', 37.8016, -122.3979, 35, 4, 12, 'indoor', false, false, true, '{"tue-sun": {"open": "10:00", "close": "17:00"}}', '$$$', 40, true, 'Paid parking nearby', true, true, true, 'high', 'clean', ARRAY['science', 'hands_on', 'interactive'], 'https://www.exploratorium.edu', 'Some exhibits too advanced for under 5, but has areas for young kids.'),

('Lindsay Wildlife Experience', 'Walnut Creek wildlife rehabilitation center and museum with live animals.', 'museum', '1931 First Ave', 'Walnut Creek', '94597', 37.8997, -122.0506, 28, 2, 12, 'indoor', false, false, true, '{"wed-sun": {"open": "10:00", "close": "17:00"}}', '$', 12, true, 'Free parking', true, false, true, 'low', 'clean', ARRAY['animals', 'wildlife', 'educational', 'nature'], 'https://www.lindsaywildlife.org', 'Up-close animal encounters. Great for animal-loving kids.'),

('Randall Museum (SF)', 'Small San Francisco museum with live animals, art studios, and exhibits.', 'museum', '199 Museum Way', 'San Francisco', '94114', 37.7650, -122.4380, 38, 2, 10, 'indoor', false, false, false, '{"tue-sat": {"open": "10:00", "close": "17:00"}}', 'free', 0, true, 'Limited parking', true, false, true, 'low', 'clean', ARRAY['animals', 'art', 'free', 'small'], 'https://randallmuseum.org', 'Free admission! Small but charming.'),

('Pixieland Amusement Park', 'Small vintage amusement park in Concord for young children.', 'amusement', '2740 E Olivera Rd', 'Concord', '94519', 37.9719, -121.9496, 35, 2, 8, 'outdoor', true, false, true, '{"weekend": {"open": "11:00", "close": "17:00"}}', '$', 12, true, 'Free parking', true, true, true, 'medium', 'clean', ARRAY['rides', 'amusement_park', 'vintage'], 'http://www.pixieland.com', 'Vintage small park perfect for young kids. Seasonal hours.'),

('Golfland (various)', 'Mini golf, arcade games, and bumper boats.', 'entertainment', 'Various locations', 'San Jose', '95112', 37.3394, -121.8903, 60, 3, 12, 'both', false, false, false, '{"daily": {"open": "10:00", "close": "22:00"}}', '$$', 15, true, 'Free parking', true, true, true, 'high', 'clean', ARRAY['mini_golf', 'arcade', 'entertainment'], NULL, 'Fun but far drive from Oakland. Good for special occasions.'),

('Jungle Fun & Adventure', 'Indoor play center with climbing structures, slides, and play areas.', 'indoor_play', '13950 E 14th St', 'San Leandro', '94578', 37.7045, -122.1302, 18, 1, 10, 'indoor', false, false, false, '{"daily": {"open": "10:00", "close": "18:00"}}', '$', 10, true, 'Parking lot', true, true, true, 'high', 'clean', ARRAY['indoor_play', 'climbing', 'rainy_day'], 'http://www.junglefunadventure.com', 'Great rainy day option. Indoor play structure.'),

('Oakland Public Library (Main)', 'Main Oakland library with excellent children''s section and story times.', 'library', '125 14th St', 'Oakland', '94612', 37.8036, -122.2719, 12, 0, 12, 'indoor', false, false, false, '{"mon-sat": {"open": "10:00", "close": "17:30"}}', 'free', 0, true, 'Nearby parking garages', true, false, true, 'low', 'clean', ARRAY['books', 'story_time', 'educational', 'free', 'indoor'], 'https://oaklandlibrary.org', 'Free story times. Great quiet indoor option.');

-- ============================================
-- OUTDOOR ADVENTURES (17)
-- ============================================

INSERT INTO activities (name, description, category, address, city, zip_code, latitude, longitude, drive_time_minutes, age_min, age_max, indoor_outdoor, weather_dependent, requires_reservation, requires_tickets, opening_hours, cost_estimate, cost_per_person, has_parking, parking_notes, has_bathrooms, has_food, stroller_accessible, energy_level, messiness_level, tags, url, notes) VALUES

('Tilden Steam Trains', 'Rideable miniature steam train through the redwoods at Tilden Park.', 'trains', 'Grizzly Peak Blvd & Lomas Cantadas', 'Berkeley', '94708', 37.9006, -122.2445, 25, 1, 12, 'outdoor', true, false, true, '{"weekend": {"open": "11:00", "close": "17:00"}}', '$', 4, true, 'Free parking', true, true, false, 'low', 'clean', ARRAY['trains', 'nature', 'outdoor'], 'https://www.ebparks.org/activities/attractions/tilden_train', 'Kids love trains! $4/person for 12-minute ride. Combine with Tilden Park activities.'),

('Tilden Little Farm', 'Free farm with animals (cows, pigs, chickens, goats) that kids can see up close.', 'farm', 'Tilden Park, Canon Dr', 'Berkeley', '94708', 37.8963, -122.2455, 25, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "08:30", "close": "17:00"}}', 'free', 0, true, 'Free parking', true, false, true, 'low', 'some_mess', ARRAY['animals', 'farm', 'free', 'educational'], 'https://www.ebparks.org/activities/attractions/tilden_little_farm', 'Free! Kids love feeding and petting animals. Can get muddy.'),

('Lake Anza (Tilden)', 'Swimming lake in Tilden Park with sandy beach, perfect for summer.', 'swimming', 'Tilden Park, Canon Dr', 'Berkeley', '94708', 37.8950, -122.2395, 25, 2, 12, 'outdoor', true, false, false, '{"summer": {"open": "11:00", "close": "18:00"}}', '$', 5, true, 'Parking fee', true, true, false, 'high', 'very_messy', ARRAY['swimming', 'beach', 'summer', 'water'], 'https://www.ebparks.org/parks/tilden', 'Summer only. Small sandy beach perfect for young kids.'),

('Point Isabel Dog Park & Shoreline', 'Huge off-leash dog park on the bay. Great for walking and watching dogs play.', 'park', '2701 Isabel St', 'Richmond', '94804', 37.9073, -122.3717, 25, 2, 12, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Large lot', true, true, true, 'medium', 'some_mess', ARRAY['dogs', 'walking', 'bay', 'outdoor'], 'https://www.ebparks.org/parks/pt_isabel', 'Great for dog lovers. Beautiful bay views. Can be windy.'),

('Ardenwood Historic Farm', 'Working historical farm with animals, wagon rides, and Victorian farmhouse.', 'farm', '34600 Ardenwood Blvd', 'Fremont', '94555', 37.5573, -122.0599, 45, 3, 12, 'outdoor', true, false, true, '{"thu-sun": {"open": "10:00", "close": "16:00"}}', '$', 10, true, 'Free parking', true, true, false, 'medium', 'some_mess', ARRAY['farm', 'animals', 'history', 'wagon_rides'], 'https://www.ebparks.org/parks/ardenwood', 'Living history farm. Train rides and animals. Farther drive.'),

('Stinson Beach', 'Beautiful Pacific Ocean beach north of SF, great for summer days.', 'beach', 'CA-1', 'Stinson Beach', '94970', 37.9015, -122.6469, 60, 2, 12, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Beach parking', true, true, false, 'high', 'very_messy', ARRAY['beach', 'ocean', 'summer'], NULL, 'Long drive but stunning beach. Can be cold/foggy. Check weather.'),

('Aquatic Park (Berkeley)', 'Berkeley park around a lagoon with walking/biking path, playground, and junior center.', 'park', '1 Bolivar Dr', 'Berkeley', '94710', 37.8668, -122.2701, 20, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Free parking', true, false, true, 'medium', 'clean', ARRAY['walking', 'biking', 'playground', 'water'], NULL, 'Flat paved path perfect for bikes and scooters.'),

('Briones Regional Park', 'Large hiking park with rolling hills, trails, and reservoir views.', 'hiking', 'Bear Creek Rd', 'Orinda', '94563', 37.9151, -122.1490, 30, 5, 12, 'outdoor', true, false, false, '{"daily": {"open": "08:00", "close": "sunset"}}', '$', 5, true, 'Parking fee', false, false, false, 'high', 'some_mess', ARRAY['hiking', 'nature', 'hills'], 'https://www.ebparks.org/parks/briones', 'Beautiful but trails may be too long for young kids. Better for older.'),

('Hayward Japanese Garden', 'Peaceful Japanese garden with koi pond, perfect for quiet exploration.', 'garden', '22373 N 3rd St', 'Hayward', '94546', 37.6655, -122.0831, 35, 3, 12, 'outdoor', true, false, false, '{"daily": {"open": "10:00", "close": "16:00"}}', 'free', 0, true, 'Free parking', true, false, true, 'low', 'clean', ARRAY['garden', 'peaceful', 'nature', 'koi'], 'https://www.haywardjapanesegardens.com', 'Quiet, peaceful garden. Free admission.'),

('Don Edwards Wildlife Refuge', 'Bay shoreline wildlife refuge with visitor center and easy walking trails.', 'nature', '1 Marshlands Rd', 'Fremont', '94555', 37.5071, -122.0533, 50, 4, 12, 'outdoor', true, false, false, '{"tue-sun": {"open": "10:00", "close": "17:00"}}', 'free', 0, true, 'Free parking', true, false, false, 'medium', 'clean', ARRAY['wildlife', 'birds', 'nature', 'educational'], 'https://www.fws.gov/refuge/don-edwards-san-francisco-bay', 'Great for bird watching. Visitor center has exhibits.'),

('Mount Diablo State Park', 'Mountain park with stunning views, hiking trails, and visitor center.', 'hiking', '96 Mitchell Canyon Rd', 'Clayton', '94517', 37.8816, -121.9144, 45, 5, 12, 'outdoor', true, false, false, '{"daily": {"open": "08:00", "close": "sunset"}}', '$', 10, true, 'Parking fee', true, false, false, 'high', 'some_mess', ARRAY['hiking', 'mountain', 'views'], 'https://www.parks.ca.gov/mountdiablo', 'Amazing views but trails steep for young kids. Better for older.'),

('Black Diamond Mines', 'Historic mining park with underground mine tours and hiking trails.', 'hiking', '5175 Somersville Rd', 'Antioch', '94509', 37.9622, -121.8627, 50, 6, 12, 'outdoor', true, true, true, '{"weekend": {"open": "08:00", "close": "sunset"}}', '$', 8, true, 'Parking fee', true, false, false, 'high', 'some_mess', ARRAY['hiking', 'history', 'mines', 'educational'], 'https://www.ebparks.org/parks/black-diamond', 'Mine tours are cool but better for older kids (6+).'),

('Coyote Hills Regional Park', 'Fremont bay shoreline park with marshes, boardwalks, and visitor center.', 'nature', '8000 Patterson Ranch Rd', 'Fremont', '94555', 37.5540, -122.0929, 45, 3, 12, 'outdoor', true, false, false, '{"daily": {"open": "08:00", "close": "sunset"}}', '$', 5, true, 'Parking fee', true, false, true, 'medium', 'clean', ARRAY['nature', 'marsh', 'boardwalk', 'birds'], 'https://www.ebparks.org/parks/coyote-hills', 'Easy flat trails. Good for nature walks and bird watching.'),

('Sunol Regional Wilderness', 'Beautiful wilderness park with Little Yosemite waterfall area.', 'hiking', '1895 Geary Rd', 'Sunol', '94586', 37.5254, -121.8198, 50, 5, 12, 'outdoor', true, false, false, '{"daily": {"open": "07:00", "close": "sunset"}}', '$', 5, true, 'Parking fee', true, false, false, 'high', 'some_mess', ARRAY['hiking', 'waterfall', 'nature'], 'https://www.ebparks.org/parks/sunol', 'Little Yosemite is beautiful but hike may be too long for young kids.'),

('Quarry Lakes Regional Park', 'Fremont park with swimming lakes, playground, and picnic areas.', 'park', '2100 Isherwood Way', 'Fremont', '94536', 37.5278, -121.9509, 42, 1, 12, 'outdoor', true, false, false, '{"daily": {"open": "06:00", "close": "sunset"}}', '$', 5, true, 'Parking fee', true, true, true, 'high', 'some_mess', ARRAY['swimming', 'playground', 'picnic'], 'https://www.ebparks.org/parks/quarry', 'Nice swimming area for summer. Farther drive.'),

('Anthony Chabot Regional Park', 'Large Oakland hills park with lake, hiking, and camping.', 'park', '9999 Redwood Rd', 'Castro Valley', '94546', 37.7703, -122.1162, 25, 3, 12, 'outdoor', true, false, false, '{"daily": {"open": "05:00", "close": "22:00"}}', 'free', 0, true, 'Free parking', true, false, false, 'high', 'some_mess', ARRAY['hiking', 'lake', 'nature'], 'https://www.ebparks.org/parks/anthony-chabot', 'Large park with many trail options.'),

('Reinhardt Redwood Regional Park Playground', 'Playground within Redwood Regional Park, surrounded by redwoods.', 'playground', 'Redwood Regional Park', 'Oakland', '94619', 37.8184, -122.1687, 20, 1, 10, 'outdoor', true, false, false, '{"daily": {"open": "sunrise", "close": "sunset"}}', 'free', 0, true, 'Free parking', true, false, true, 'medium', 'clean', ARRAY['playground', 'redwoods', 'nature'], 'https://www.ebparks.org/parks/redwood', 'Nice playground in beautiful redwood setting.');

-- ============================================
-- SEASONAL & SPECIAL EVENTS (15)
-- ============================================

INSERT INTO activities (name, description, category, address, city, zip_code, latitude, longitude, drive_time_minutes, age_min, age_max, indoor_outdoor, weather_dependent, requires_reservation, requires_tickets, opening_hours, cost_estimate, cost_per_person, has_parking, parking_notes, has_bathrooms, has_food, stroller_accessible, energy_level, messiness_level, tags, url, notes) VALUES

('Pumpkin Patches (various)', 'Seasonal pumpkin picking at various Bay Area farms (Oct)', 'seasonal', 'Various locations', 'Various', NULL, 37.8000, -122.2000, 30, 1, 10, 'outdoor', true, false, false, NULL, '$$', 20, true, 'Varies by farm', true, true, true, 'medium', 'some_mess', ARRAY['pumpkins', 'fall', 'seasonal', 'farm'], NULL, 'Popular October activity. Check specific farms for hours and pricing.'),

('Christmas Tree Farms (various)', 'Cut-your-own Christmas tree farms (Nov-Dec)', 'seasonal', 'Various locations', 'Various', NULL, 37.8000, -122.2000, 40, 2, 12, 'outdoor', true, false, false, NULL, '$$', 50, true, 'Varies by farm', true, true, false, 'medium', 'some_mess', ARRAY['christmas', 'winter', 'seasonal'], NULL, 'Late Nov through Dec. Fun family tradition. May need saw.'),

('Jack London Square Farmers Market', 'Sunday farmers market with food, crafts, and waterfront views.', 'farmers_market', 'Jack London Square', 'Oakland', '94607', 37.7946, -122.2780, 15, 0, 12, 'outdoor', true, false, false, '{"sun": {"open": "09:00", "close": "14:00"}}', 'free', 0, true, 'Parking garage', true, true, true, 'low', 'clean', ARRAY['farmers_market', 'food', 'waterfront'], 'https://www.jacklondonsquare.com', 'Great Sunday morning activity. Food trucks and vendors.'),

('Old Oakland Farmers Market', 'Friday farmers market in downtown Oakland.', 'farmers_market', '9th St & Broadway', 'Oakland', '94607', 37.8028, -122.2715, 12, 0, 12, 'outdoor', true, false, false, '{"fri": {"open": "08:00", "close": "14:00"}}', 'free', 0, true, 'Parking garages nearby', true, true, true, 'low', 'clean', ARRAY['farmers_market', 'food', 'downtown'], NULL, 'Friday morning market. Great produce and prepared foods.'),

('Grand Lake Farmers Market', 'Saturday farmers market at Grand Lake/Lake Merritt.', 'farmers_market', 'Grand Ave & Lake Park Ave', 'Oakland', '94610', 37.8103, -122.2520, 10, 0, 12, 'outdoor', true, false, false, '{"sat": {"open": "09:00", "close": "14:00"}}', 'free', 0, true, 'Street parking', true, true, true, 'low', 'clean', ARRAY['farmers_market', 'food'], NULL, 'Popular Saturday market near Grand Lake Theatre.'),

('Montclair Farmers Market', 'Sunday farmers market in Montclair Village (in Oakland area!)', 'farmers_market', 'Moraga Ave', 'Oakland', '94611', 37.8338, -122.2099, 5, 0, 12, 'outdoor', true, false, false, '{"sun": {"open": "09:00", "close": "13:00"}}', 'free', 0, true, 'Street parking', true, true, true, 'low', 'clean', ARRAY['farmers_market', 'food', 'neighborhood'], NULL, 'Sunday mornings in Montclair Village.'),

('Oakland Art Murmur', 'Monthly first Friday art walk in downtown Oakland.', 'art', 'Telegraph Ave area', 'Oakland', '94612', 37.8090, -122.2711, 12, 5, 12, 'outdoor', true, false, false, '{"first_friday": {"open": "18:00", "close": "22:00"}}', 'free', 0, true, 'Street parking', true, true, true, 'medium', 'clean', ARRAY['art', 'evening', 'downtown'], 'https://oaklandartmurmur.org', 'First Friday of each month. Better for older kids. Evening event.'),

('Oakland Museum Free Days', 'Free community days at Oakland Museum (check calendar)', 'museum', '1000 Oak St', 'Oakland', '94607', 37.7973, -122.2655, 12, 3, 12, 'indoor', false, false, false, NULL, 'free', 0, true, 'Parking garage', true, true, true, 'low', 'clean', ARRAY['museum', 'free', 'community'], 'https://museumca.org', 'Check calendar for free community days. Kids under 5 always free.'),

('Fleet Week Air Show (SF)', 'October air show over SF Bay with Blue Angels.', 'event', 'Marina Green', 'San Francisco', '94123', 37.8035, -122.4374, 35, 3, 12, 'outdoor', true, false, false, NULL, 'free', 0, true, 'Limited parking', true, true, false, 'medium', 'clean', ARRAY['airshow', 'planes', 'fall', 'special'], NULL, 'Early-mid October. Amazing air show. Can be very crowded.'),

('Berkeley Kite Festival', 'Annual summer kite flying festival at Cesar Chavez Park.', 'festival', 'Cesar Chavez Park', 'Berkeley', '94710', 37.8669, -122.3195, 22, 2, 12, 'outdoor', true, false, false, NULL, 'free', 0, true, 'Free parking', true, true, true, 'low', 'clean', ARRAY['kites', 'festival', 'summer', 'outdoor'], NULL, 'Usually late July. Beautiful kite displays. Bring your own kite!'),

('Solano Stroll', 'September street festival in Berkeley/Albany with vendors, food, and activities.', 'festival', 'Solano Ave', 'Berkeley', '94707', 37.8908, -122.2776, 18, 0, 12, 'outdoor', true, false, false, NULL, 'free', 0, true, 'Street parking', true, true, true, 'high', 'clean', ARRAY['festival', 'fall', 'street_fair'], 'https://solanostroll.org', 'Second Sunday in September. Huge street fair. Can be crowded.'),

('Oakland Marathon Cheering', 'Cheer on marathon runners in March along Oakland streets.', 'event', 'Various Oakland locations', 'Oakland', '94611', 37.8324, -122.2128, 5, 2, 12, 'outdoor', true, false, false, NULL, 'free', 0, true, 'Street parking', true, false, true, 'low', 'clean', ARRAY['marathon', 'community', 'spring'], NULL, 'Late March. Fun to watch and cheer. Bring signs!'),

('Rockridge Out & About', 'August street festival in Rockridge neighborhood.', 'festival', 'College Ave', 'Oakland', '94618', 37.8449, -122.2532, 8, 0, 12, 'outdoor', true, false, false, NULL, 'free', 0, true, 'Street parking', true, true, true, 'medium', 'clean', ARRAY['festival', 'summer', 'neighborhood'], NULL, 'Annual August street fair in Rockridge. Food, vendors, music.'),

('Piedmont 4th of July Parade', 'Traditional Independence Day parade in Piedmont.', 'event', 'Highland Ave', 'Piedmont', '94611', 37.8244, -122.2318, 5, 2, 12, 'outdoor', true, false, false, '{"july_4": {"open": "10:00", "close": "12:00"}}', 'free', 0, true, 'Very limited', true, false, true, 'low', 'clean', ARRAY['parade', 'july_4th', 'summer', 'tradition'], NULL, 'Classic small-town July 4th parade. Short drive from Oakland neighborhoods.'),

('Orinda Classic Car Show', 'September classic car show in Orinda downtown.', 'event', 'Orinda Village', 'Orinda', '94563', 37.8771, -122.1797, 22, 3, 12, 'outdoor', true, false, false, NULL, 'free', 0, true, 'Free parking', true, true, true, 'low', 'clean', ARRAY['cars', 'fall', 'community'], NULL, 'Annual September event. Great for car-loving kids.');

-- ============================================
-- Verification
-- ============================================

-- Count activities by category
DO $$
DECLARE
    parks_count INT;
    museums_count INT;
    outdoor_count INT;
    seasonal_count INT;
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO parks_count FROM activities WHERE category IN ('park', 'playground');
    SELECT COUNT(*) INTO museums_count FROM activities WHERE category IN ('museum', 'zoo', 'amusement', 'cinema', 'indoor_play', 'library', 'entertainment');
    SELECT COUNT(*) INTO outdoor_count FROM activities WHERE category IN ('trains', 'farm', 'swimming', 'hiking', 'beach', 'nature', 'garden');
    SELECT COUNT(*) INTO seasonal_count FROM activities WHERE category IN ('seasonal', 'farmers_market', 'art', 'event', 'festival');
    SELECT COUNT(*) INTO total_count FROM activities;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Activity Seed Data Summary:';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Parks & Playgrounds: % activities', parks_count;
    RAISE NOTICE 'Museums & Indoor: % activities', museums_count;
    RAISE NOTICE 'Outdoor Adventures: % activities', outdoor_count;
    RAISE NOTICE 'Seasonal & Special: % activities', seasonal_count;
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TOTAL ACTIVITIES: %', total_count;
    RAISE NOTICE '===========================================';
END $$;
