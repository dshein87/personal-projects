#!/usr/bin/env python3
"""
Test script to verify Supabase database connection and seed data.
Run this to validate the database is properly set up.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Check if required packages are installed
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ Error: supabase-py not installed")
    print("Install with: pip install supabase")
    sys.exit(1)

def main():
    """Test Supabase connection and verify seed data."""

    # Get credentials from environment
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_ANON_KEY")

    if not url or not key:
        print("❌ Error: SUPABASE_URL or SUPABASE_ANON_KEY not set in .env")
        sys.exit(1)

    print(f"🔗 Connecting to: {url}")

    try:
        # Create Supabase client
        supabase: Client = create_client(url, key)
        print("✅ Connected to Supabase!\n")

        # Test 1: List all tables
        print("=" * 60)
        print("TEST 1: Checking tables exist")
        print("=" * 60)

        # Try to query each expected table
        expected_tables = [
            'activities',
            'restaurants',
            'visits',
            'events',
            'people',
            'preferences',
            'artist_preferences',
            'concerts',
            'venues',
            'suggestion_history'
        ]

        table_status = {}
        for table in expected_tables:
            try:
                result = supabase.table(table).select("*", count='exact').limit(0).execute()
                table_status[table] = True
                print(f"✅ {table}")
            except Exception as e:
                table_status[table] = False
                print(f"❌ {table} - Error: {str(e)}")

        print()

        # Test 2: Count seed data
        print("=" * 60)
        print("TEST 2: Verifying seed data counts")
        print("=" * 60)

        # Count activities
        try:
            result = supabase.table('activities').select('*', count='exact').limit(0).execute()
            activities_count = result.count
            print(f"📊 Activities: {activities_count} rows")
            if activities_count < 70:
                print(f"   ⚠️  Expected ~75 activities, found {activities_count}")
            else:
                print(f"   ✅ Looks good!")
        except Exception as e:
            print(f"❌ Error counting activities: {e}")

        # Count restaurants
        try:
            result = supabase.table('restaurants').select('*', count='exact').limit(0).execute()
            restaurants_count = result.count
            print(f"📊 Restaurants: {restaurants_count} rows")
            if restaurants_count < 20:
                print(f"   ⚠️  Expected ~25 restaurants, found {restaurants_count}")
            else:
                print(f"   ✅ Looks good!")
        except Exception as e:
            print(f"❌ Error counting restaurants: {e}")

        # Count venues
        try:
            result = supabase.table('venues').select('*', count='exact').limit(0).execute()
            venues_count = result.count
            print(f"📊 Venues: {venues_count} rows")
            if venues_count < 5:
                print(f"   ⚠️  Expected ~5 venues, found {venues_count}")
            else:
                print(f"   ✅ Looks good!")
        except Exception as e:
            print(f"❌ Error counting venues: {e}")

        print()

        # Test 3: Check dietary restrictions
        print("=" * 60)
        print("TEST 3: Checking dietary restriction data")
        print("=" * 60)

        try:
            result = supabase.table('restaurants') \
                .select('name, cuisine, celiac_safe') \
                .eq('celiac_safe', True) \
                .limit(5) \
                .execute()

            celiac_count = len(result.data)
            print(f"🌮 Celiac-safe restaurants: {celiac_count} (showing first 5)")

            for restaurant in result.data:
                print(f"   • {restaurant['name']} ({restaurant['cuisine']})")

            if celiac_count == 0:
                print("   ⚠️  No celiac-safe restaurants found! Check seed data.")
        except Exception as e:
            print(f"❌ Error querying restaurants: {e}")

        print()

        # Test 4: Sample activities
        print("=" * 60)
        print("TEST 4: Sample activities data")
        print("=" * 60)

        try:
            result = supabase.table('activities') \
                .select('name, category, city, drive_time_minutes') \
                .order('name') \
                .limit(5) \
                .execute()

            print(f"🎯 Sample activities (showing first 5):")
            for activity in result.data:
                drive_time = activity.get('drive_time_minutes', 'Unknown')
                print(f"   • {activity['name']}")
                print(f"     Category: {activity['category']} | City: {activity['city']} | Drive: {drive_time} min")
        except Exception as e:
            print(f"❌ Error querying activities: {e}")

        print()
        print("=" * 60)
        print("✅ All tests completed!")
        print("=" * 60)

    except Exception as e:
        print(f"❌ Connection failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
