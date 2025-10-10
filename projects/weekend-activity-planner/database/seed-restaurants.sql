-- Weekend Activity Planner - Restaurant Seed Data
-- ~25 family-friendly restaurants in Oakland/East Bay
--
-- Focus:
-- - Celiac-safe options (family member)
-- - Allergen-free options (family member)
-- - Mexican cuisine preference
-- - Kid-friendly atmosphere

-- ============================================
-- MEXICAN RESTAURANTS (Primary Focus - 12)
-- ============================================

INSERT INTO restaurants (name, cuisine, description, address, city, zip_code, latitude, longitude, drive_time_minutes, celiac_safe, celiac_notes, sesame_free_options, cashew_free_options, flax_free_options, allergen_notes, kid_friendly, has_kids_menu, high_chairs_available, opening_hours, price_range, avg_meal_cost, yelp_url, google_maps_url, phone, website, notes) VALUES

-- Popular taqueria options
('Tacos Oscar', 'Mexican', 'Casual taqueria with excellent tacos. Casual taqueria with excellent tacos on Piedmont Ave.', '4038 Piedmont Ave', 'Oakland', '94611', 37.8282, -122.2384, 8, true, 'Corn tortillas are naturally gluten-free. Ask about cross-contamination.', true, true, true, 'Generally allergen-friendly. Avoid salsas with seeds. Ask about specific allergens.', true, false, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$', 12, NULL, NULL, '(510) 985-7336', NULL, 'Popular neighborhood taqueria with corn tortillas.'),

('Cholita Linda', 'Mexican', 'Popular Mexican street food with great tacos and agua frescas. Near Heather Farms Park.', '4923 Telegraph Ave', 'Oakland', '94609', 37.8392, -122.2619, 12, true, 'Corn tortillas available. Staff knowledgeable about gluten-free options.', true, true, true, 'Ask about specific allergens in salsas and toppings.', true, false, true, '{"daily": {"open": "11:00", "close": "20:00"}}', '$', 14, 'https://www.yelp.com/biz/cholita-linda-oakland', NULL, '(510) 594-9358', 'https://cholitalinda.com', 'Popular Mexican street food spot in Oakland.'),

('Tacubaya', 'Mexican', 'Berkeley taqueria with fresh ingredients and celiac-safe practices.', '1788 4th St', 'Berkeley', '94710', 37.8699, -122.2983, 18, true, 'Dedicated gluten-free prep area. Staff very aware of celiac needs.', true, true, true, 'Ask server about allergen-free options. Generally accommodating.', true, true, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$$', 16, 'https://www.yelp.com/biz/tacubaya-berkeley', NULL, '(510) 558-8664', 'http://tacubaya.net', 'Very celiac-friendly. Great Mexican food with care for dietary restrictions.'),

('Comal', 'Mexican', 'Berkeley Mexican restaurant with wood-fired dishes and gluten-free options.', '2020 Shattuck Ave', 'Berkeley', '94704', 37.8729, -122.2685, 18, true, 'Many gluten-free options marked on menu. Kitchen takes allergies seriously.', true, true, true, 'Notify server of all allergies. Kitchen can accommodate most restrictions.', true, true, true, '{"daily": {"open": "11:30", "close": "21:00"}}', '$$', 20, 'https://www.yelp.com/biz/comal-berkeley', NULL, '(510) 926-6300', 'https://comalberkeley.com', 'Higher-end Mexican. Excellent for dietary restrictions. Reservations recommended.'),

('Nopalito', 'Mexican', 'San Francisco organic Mexican restaurant with many GF options.', '306 Broderick St', 'San Francisco', '94117', 37.7716, -122.4388, 35, true, 'Extensive gluten-free menu. Organic ingredients. Very allergy-aware.', true, true, true, 'Inform server of all allergies. Very accommodating kitchen.', true, true, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$$', 22, 'https://www.yelp.com/biz/nopalito-san-francisco', NULL, '(415) 437-0303', 'https://nopalitosf.com', 'Organic Mexican food. Great for celiac. Worth the drive for special occasions.'),

('La Finca', 'Mexican/Peruvian', 'Berkeley Mexican-Peruvian fusion with celiac options.', '2705 Telegraph Ave', 'Berkeley', '94705', 37.8630, -122.2588, 16, true, 'Corn-based dishes available. Staff knowledgeable about gluten.', true, true, true, 'Ask about allergens in sauces and marinades.', true, false, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$', 15, 'https://www.yelp.com/biz/la-finca-berkeley', NULL, '(510) 704-1272', NULL, 'Good value. Celiac-friendly options available.'),

('Dona Tomas', 'Mexican', 'Oakland neighborhood Mexican restaurant with sophisticated menu.', '5004 Telegraph Ave', 'Oakland', '94609', 37.8398, -122.2620, 12, true, 'Many naturally GF dishes. Will modify items for dietary restrictions.', true, true, true, 'Speak with server about all allergies. Kitchen accommodating.', true, true, true, '{"tue-sun": {"open": "17:00", "close": "21:00"}}', '$$', 24, 'https://www.yelp.com/biz/doña-tomás-oakland', NULL, '(510) 450-0522', 'https://www.donatomasoakland.com', 'Dinner only. More upscale. Good for special family dinners.'),

('Taqueria Los Gallos', 'Mexican', 'Walnut Creek taqueria with fresh ingredients and corn tortillas.', '1552 N Main St', 'Walnut Creek', '94596', 37.9010, -122.0674, 30, true, 'Corn tortillas. Ask about cross-contamination for celiac safety.', true, true, true, 'Generally safe for common allergens. Always ask about specifics.', true, false, true, '{"daily": {"open": "10:00", "close": "20:00"}}', '$', 12, NULL, NULL, '(925) 933-4155', NULL, 'Near Walnut Creek activities. Good quick Mexican food.'),

('Tamarindo Antojeria', 'Mexican', 'Oakland Antojeria with creative tacos and GF options.', '468 8th St', 'Oakland', '94607', 37.8004, -122.2724, 15, true, 'Corn tortillas and many GF options. Creative menu.', true, true, true, 'Ask about allergens in specialty toppings and sauces.', true, false, true, '{"tue-sun": {"open": "11:00", "close": "21:00"}}', '$$', 18, 'https://www.yelp.com/biz/tamarindo-antojeria-oakland', NULL, '(510) 444-1944', 'https://tamarindoantojeria.com', 'Jack London Square area. Good food, celiac-aware.'),

('Masa', 'Mexican', 'Echo Park Mexican with house-made tortillas (corn available).', '3925 Piedmont Ave', 'Oakland', '94611', 37.8273, -122.2385, 8, true, 'House-made corn tortillas. Will accommodate gluten-free requests.', true, true, true, 'Notify server of allergies. Kitchen can modify dishes.', true, false, true, '{"tue-sun": {"open": "17:00", "close": "21:00"}}', '$$', 20, 'https://www.yelp.com/biz/masa-oakland', NULL, '(510) 420-1515', NULL, 'Dinner only. Good neighborhood spot in Oakland.'),

('Cactus Taqueria', 'Mexican', 'Oakland taqueria chain with multiple locations, celiac options.', 'Multiple locations', 'Oakland', '94610', 37.8028, -122.2715, 10, true, 'Corn tortillas standard. Generally safe for celiac with precautions.', true, true, true, 'Ask about cross-contamination and specific allergens.', true, false, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$', 12, 'https://www.yelp.com/biz/cactus-taqueria-oakland', NULL, '(510) 594-9200', 'https://cactustaqueria.com', 'Multiple Oakland locations. Reliable for quick Mexican.'),

('El Huarache Loco', 'Mexican', 'Larkspur Landing Mexican food truck with excellent huaraches.', '2500 Larkspur Landing Cir', 'Larkspur', '94939', 37.9444, -122.5086, 45, true, 'Corn-based. Authentic Mexican street food. Outdoor seating.', true, true, true, 'Simple ingredients, generally allergen-safe. Always ask.', true, false, false, '{"daily": {"open": "11:00", "close": "19:00"}}', '$', 14, NULL, NULL, NULL, NULL, 'Food truck. Authentic corn-based Mexican. Farther drive but worth it for special trip.');

-- ============================================
-- CELIAC-SAFE NON-MEXICAN (8)
-- ============================================

INSERT INTO restaurants (name, cuisine, description, address, city, zip_code, latitude, longitude, drive_time_minutes, celiac_safe, celiac_notes, sesame_free_options, cashew_free_options, flax_free_options, allergen_notes, kid_friendly, has_kids_menu, high_chairs_available, opening_hours, price_range, avg_meal_cost, yelp_url, google_maps_url, phone, website, notes) VALUES

('Tender Greens', 'American/Salads', 'Farm-to-table restaurant with extensive GF menu and allergen info.', '6300 College Ave', 'Oakland', '94618', 37.8507, -122.2519, 10, true, 'Extensive gluten-free menu clearly marked. Very knowledgeable staff.', true, true, true, 'Full allergen menu available. Very accommodating.', true, true, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$$', 16, 'https://www.yelp.com/biz/tender-greens-oakland', NULL, '(510) 594-0832', 'https://www.tendergreens.com', 'Very celiac-safe. Near Tilden Park activities. Extensive allergen information available.'),

('Souvla', 'Greek/Mediterranean', 'SF Greek restaurant with GF pita and many safe options.', 'Multiple SF locations', 'San Francisco', '94103', 37.7699, -122.4194, 38, true, 'Gluten-free pita available. Grilled meats and salads naturally GF.', true, true, true, 'Ask about tahini (sesame). Can modify most dishes for allergens.', true, false, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$$', 18, 'https://www.yelp.com/biz/souvla-san-francisco', NULL, NULL, 'https://souvla.com', 'Multiple SF locations. GF pita is excellent. Watch for sesame (tahini).'),

('Dosa', 'Indian', 'Oakland South Indian restaurant with naturally GF dosas (rice/lentil).', '1700 Shattuck Ave', 'Oakland', '94607', 37.8060, -122.2693, 15, true, 'Dosas are naturally gluten-free (rice/lentil). Many safe options.', true, false, true, 'WATCH: Cashews used in many Indian dishes. Always notify server. Some dishes have sesame.', true, true, true, '{"daily": {"open": "11:30", "close": "21:00"}}', '$$', 20, 'https://www.yelp.com/biz/dosa-oakland', NULL, '(510) 251-1600', 'https://dosapresents.com', 'Excellent dosas (GF). CRITICAL: Inform about cashew allergy - common in Indian food.'),

('Burma Superstar', 'Burmese', 'Oakland Burmese restaurant with gluten-free options.', '4721 Telegraph Ave', 'Oakland', '94609', 37.8360, -122.2613, 12, true, 'Many rice-based dishes. Will accommodate GF requests. Popular, expect wait.', true, false, true, 'WATCH: Cashews and sesame seeds common in Burmese cuisine. Inform server of all allergies.', true, false, true, '{"daily": {"open": "11:30", "close": "21:00"}}', '$$', 18, 'https://www.yelp.com/biz/burma-superstar-oakland', NULL, '(510) 655-2828', 'https://burmasuperstar.com', 'IMPORTANT: Notify about all family allergens. Can be very crowded.'),

('Homeroom', 'American/Mac & Cheese', 'Oakland mac and cheese restaurant with GF pasta options.', '400 40th St', 'Oakland', '94609', 37.8297, -122.2625, 12, true, 'Gluten-free pasta available for any mac and cheese. Dedicated GF preparation.', true, true, true, 'Generally allergen-friendly. Ask about specific ingredients in sauces.', true, true, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$$', 16, 'https://www.yelp.com/biz/homeroom-oakland', NULL, '(510) 597-0400', 'https://www.homeroom510.com', 'Kids love mac and cheese! GF pasta available. Can get crowded.'),

('Zachary''s Pizza', 'Pizza', 'Oakland/Berkeley pizza with gluten-free crust available.', 'Multiple locations', 'Oakland', '94618', 37.8446, -122.2532, 10, true, 'Gluten-free crust available. Note: prepared in shared kitchen, risk of cross-contamination.', true, true, true, 'Generally allergen-friendly toppings. Ask about specific ingredients.', true, true, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$$', 20, 'https://www.yelp.com/biz/zacharys-chicago-pizza-oakland', NULL, '(510) 655-6385', 'https://zacharys.com', 'GF crust but shared kitchen - discuss celiac concerns with staff. Famous deep dish.'),

('Fonda', 'Spanish', 'Albany Spanish restaurant with many naturally GF tapas.', '1501 Solano Ave', 'Albany', '94706', 37.8903, -122.2759, 16, true, 'Many tapas naturally gluten-free. Knowledgeable about dietary restrictions.', true, true, true, 'Some dishes have nuts/seeds. Always notify server of all allergies.', true, false, true, '{"daily": {"open": "17:00", "close": "21:00"}}', '$$', 25, 'https://www.yelp.com/biz/fonda-albany', NULL, '(510) 559-9006', 'https://fondasolano.com', 'Dinner only. More upscale. Good for date nights or special occasions.'),

('Va de Vi', 'Spanish/Tapas', 'Walnut Creek tapas restaurant with GF options.', '1511 Mt Diablo Blvd', 'Walnut Creek', '94596', 37.9000, -122.0650, 28, true, 'Many tapas GF. Staff very knowledgeable about allergies.', true, true, true, 'Notify server of all allergies. Can modify most dishes.', true, false, true, '{"daily": {"open": "11:30", "close": "21:00"}}', '$$', 28, 'https://www.yelp.com/biz/va-de-vi-walnut-creek', NULL, '(925) 979-0100', 'https://www.vadevitapas.com', 'Upscale tapas. Near Walnut Creek activities. Good for lunch after Heather Farms.');

-- ============================================
-- KID-FRIENDLY CHAINS (Celiac-aware) - 5
-- ============================================

INSERT INTO restaurants (name, cuisine, description, address, city, zip_code, latitude, longitude, drive_time_minutes, celiac_safe, celiac_notes, sesame_free_options, cashew_free_options, flax_free_options, allergen_notes, kid_friendly, has_kids_menu, high_chairs_available, opening_hours, price_range, avg_meal_cost, yelp_url, google_maps_url, phone, website, notes) VALUES

('Chipotle', 'Mexican', 'Fast casual Mexican chain. Most items naturally GF (corn tortillas, bowls, salads).', 'Multiple locations', 'Oakland', '94611', 37.8324, -122.2128, 5, true, 'Bowls and salads with corn tortillas/chips are GF. Staff trained on allergens. Avoid flour tortillas/cross-contamination.', true, true, true, 'Full allergen information available online and in-store. Generally safe for listed allergens.', true, true, true, '{"daily": {"open": "10:45", "close": "22:00"}}', '$', 12, NULL, NULL, NULL, 'https://www.chipotle.com', 'Multiple locations. Reliable for celiac. Always ask about clean prep. Fast and convenient.'),

('True Food Kitchen', 'American/Healthy', 'Health-focused restaurant with extensive GF menu and allergen filters.', '1727 Willow Pass Rd', 'Concord', '94520', 37.9776, -121.9765, 32, true, 'Extensive GF menu. Very allergy-aware. Can filter menu by allergen online.', true, true, true, 'Online allergen menu lets you filter by any allergy. Extremely accommodating.', true, true, true, '{"daily": {"open": "11:00", "close": "21:00"}}', '$$', 22, 'https://www.yelp.com/biz/true-food-kitchen-concord', NULL, '(925) 478-1660', 'https://www.truefoodkitchen.com', 'Amazing for dietary restrictions. Online allergen filter is excellent. Worth the drive.'),

('Yard House', 'American', 'Restaurant chain with extensive GF menu clearly marked.', 'Multiple locations', 'San Jose', '95113', 37.3318, -121.8906, 55, true, 'Extensive gluten-free menu. Kitchen takes allergies seriously.', true, true, true, 'Full allergen menu available. Can accommodate most restrictions.', true, true, true, '{"daily": {"open": "11:00", "close": "22:00"}}', '$$', 20, NULL, NULL, NULL, 'https://www.yardhouse.com', 'Long drive but reliable chain with good GF options. Multiple Bay Area locations.'),

('BJ''s Restaurant', 'American', 'Chain restaurant with GF pizza and extensive GF menu.', 'Multiple locations', 'Walnut Creek', '94596', 37.9067, -122.0549, 28, true, 'GF pizza and pasta available. Separate GF menu. Training on cross-contamination.', true, true, true, 'GF menu available. Ask about specific allergens in sauces.', true, true, true, '{"daily": {"open": "11:00", "close": "22:00"}}', '$$', 18, NULL, NULL, NULL, 'https://www.bjsrestaurants.com', 'Multiple locations. Decent GF pizza. Good backup option.'),

('Panera Bread', 'Bakery/Cafe', 'Bakery cafe with some GF options (limited but available).', 'Multiple locations', 'Oakland', '94611', 37.8300, -122.2100, 8, false, 'CAUTION: Bakery environment, high cross-contamination risk. Has some GF items but NOT recommended for celiac.', true, true, true, 'Bakery environment NOT ideal for celiac. Use with caution or avoid.', true, true, true, '{"daily": {"open": "07:00", "close": "20:00"}}', '$', 12, NULL, NULL, NULL, 'https://www.panerabread.com', 'NOT RECOMMENDED for celiac due to bakery cross-contamination. Listed for completeness only.');

-- ============================================
-- Verification
-- ============================================

DO $$
DECLARE
    mexican_count INT;
    celiac_count INT;
    total_count INT;
BEGIN
    SELECT COUNT(*) INTO mexican_count FROM restaurants WHERE cuisine LIKE '%Mexican%' OR cuisine LIKE '%Mexican%';
    SELECT COUNT(*) INTO celiac_count FROM restaurants WHERE celiac_safe = true;
    SELECT COUNT(*) INTO total_count FROM restaurants;

    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Restaurant Seed Data Summary:';
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Mexican restaurants: %', mexican_count;
    RAISE NOTICE 'Celiac-safe restaurants: %', celiac_count;
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'TOTAL RESTAURANTS: %', total_count;
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'ALLERGEN INFORMATION:';
    RAISE NOTICE 'Family member: Celiac (gluten-free required)';
    RAISE NOTICE 'Family member: Multiple food allergies';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'WARNING: Indian and Burmese cuisines often';
    RAISE NOTICE 'contain cashews and sesame. Always notify';
    RAISE NOTICE 'servers about all allergies!';
    RAISE NOTICE '===========================================';
END $$;
