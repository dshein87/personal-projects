#!/usr/bin/env python3
"""
Setup Supabase database with schema and seed data
"""
import os
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get credentials from environment (NEVER hardcode passwords!)
db_password = os.getenv("DATABASE_PASSWORD")
project_ref = os.getenv("SUPABASE_PROJECT_REF", "ohdmrfyyavlkoflbbjsd")

# Validate required environment variables
if not db_password:
    print("❌ ERROR: DATABASE_PASSWORD not set in .env file!")
    print("Get your database password from:")
    print(f"https://supabase.com/dashboard/project/{project_ref}/settings/database")
    exit(1)

# Try direct connection
connection_string = f"postgresql://postgres:{db_password}@db.{project_ref}.supabase.co:5432/postgres"

print("Connecting to Supabase database...")
print(f"Project: {project_ref}")

try:
    # Connect to database
    conn = psycopg2.connect(connection_string, connect_timeout=10)
    conn.autocommit = True
    cursor = conn.cursor()

    print("✓ Connected successfully!")

    # Execute schema.sql
    print("\nExecuting schema.sql...")
    with open('database/schema.sql', 'r') as f:
        schema_sql = f.read()

    cursor.execute(schema_sql)
    print("✓ Schema created successfully!")

    # Execute seed-activities.sql
    print("\nExecuting seed-activities.sql...")
    with open('database/seed-activities.sql', 'r') as f:
        activities_sql = f.read()

    cursor.execute(activities_sql)
    print("✓ Activities loaded successfully!")

    # Execute seed-restaurants.sql
    print("\nExecuting seed-restaurants.sql...")
    with open('database/seed-restaurants.sql', 'r') as f:
        restaurants_sql = f.read()

    cursor.execute(restaurants_sql)
    print("✓ Restaurants loaded successfully!")

    # Verify tables
    print("\nVerifying database setup...")
    cursor.execute("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name;
    """)
    tables = cursor.fetchall()
    print(f"✓ Found {len(tables)} tables:")
    for table in tables:
        print(f"  - {table[0]}")

    # Count records
    cursor.execute("SELECT COUNT(*) FROM activities;")
    activity_count = cursor.fetchone()[0]
    print(f"\n✓ Activities: {activity_count} records")

    cursor.execute("SELECT COUNT(*) FROM restaurants;")
    restaurant_count = cursor.fetchone()[0]
    print(f"✓ Restaurants: {restaurant_count} records")

    cursor.execute("SELECT COUNT(*) FROM venues;")
    venue_count = cursor.fetchone()[0]
    print(f"✓ Venues: {venue_count} records")

    print("\n🎉 Database setup complete!")

    cursor.close()
    conn.close()

except psycopg2.OperationalError as e:
    print(f"\n❌ Connection failed: {e}")
    print("\nTrying alternative connection method (pooler)...")

    # Try pooler connection
    pooler_string = f"postgresql://postgres.{project_ref}:{db_password}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

    try:
        conn = psycopg2.connect(pooler_string, connect_timeout=10)
        print("✓ Connected via pooler!")
        # ... rest of the code
    except Exception as pooler_error:
        print(f"❌ Pooler connection also failed: {pooler_error}")
        print("\nPlease use the Supabase Dashboard SQL Editor instead:")
        print(f"https://supabase.com/dashboard/project/{project_ref}/sql/new")

except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()
