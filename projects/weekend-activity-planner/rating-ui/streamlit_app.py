"""
Weekend Activity Planner - Bootstrap Rating UI

This Streamlit app helps you quickly rate all seeded activities
to bootstrap the recommendation system.

Usage:
    streamlit run streamlit_app.py
"""

import streamlit as st
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="../.env")

# Check for Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

# Only import supabase if credentials are available
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        SUPABASE_AVAILABLE = True
    except Exception as e:
        st.error(f"Supabase connection failed: {e}")
        SUPABASE_AVAILABLE = False
else:
    SUPABASE_AVAILABLE = False
    st.warning("⚠️ Supabase credentials not found in .env file. Running in demo mode.")


# Page config
st.set_page_config(
    page_title="Activity Rating - Weekend Planner",
    page_icon="⭐",
    layout="wide"
)

# Initialize session state
if 'current_index' not in st.session_state:
    st.session_state.current_index = 0
if 'activities' not in st.session_state:
    st.session_state.activities = []
if 'ratings' not in st.session_state:
    st.session_state.ratings = {}
if 'loaded' not in st.session_state:
    st.session_state.loaded = False


def load_activities():
    """Load activities from Supabase"""
    if not SUPABASE_AVAILABLE:
        # Demo data for testing without Supabase
        return [
            {
                'id': '1',
                'name': 'Frog Park (Demo)',
                'description': 'Demo activity for testing',
                'category': 'park',
                'city': 'Oakland',
                'cost_estimate': 'free'
            }
        ]

    try:
        response = supabase.table('activities').select(
            'id, name, description, category, city, address, '
            'drive_time_minutes, cost_estimate, age_min, age_max, '
            'indoor_outdoor, weather_dependent, tags, notes, url'
        ).order('city', desc=False).order('name', desc=False).execute()

        return response.data
    except Exception as e:
        st.error(f"Error loading activities: {e}")
        return []


def save_rating(activity_id, rating_data):
    """Save rating to session state (and optionally Supabase)"""
    st.session_state.ratings[activity_id] = rating_data


def push_to_supabase():
    """Push all ratings to Supabase as visits"""
    if not SUPABASE_AVAILABLE:
        st.warning("Supabase not available. Ratings saved locally only.")
        return False

    try:
        visits_to_insert = []
        current_date = datetime.now().isoformat()

        for activity_id, rating in st.session_state.ratings.items():
            if rating.get('status') == 'visited':
                visit = {
                    'activity_id': activity_id,
                    'visit_type': 'activity',
                    'visited_at': rating.get('last_visited', current_date),
                    'attendees': ['david', 'wife', '3yo', '5yo'],
                    'rating_3yo': rating.get('rating_3yo'),
                    'rating_5yo': rating.get('rating_5yo'),
                    'rating_overall': rating.get('rating_overall'),
                    'notes': rating.get('notes', ''),
                    'would_return': rating.get('would_return', True),
                }
                visits_to_insert.append(visit)

        if visits_to_insert:
            supabase.table('visits').insert(visits_to_insert).execute()
            return True
        return False
    except Exception as e:
        st.error(f"Error pushing to Supabase: {e}")
        return False


# Load activities on first run
if not st.session_state.loaded:
    with st.spinner("Loading activities from database..."):
        st.session_state.activities = load_activities()
        st.session_state.loaded = True

# Header
st.title("⭐ Weekend Activity Planner - Bootstrap Rating")
st.markdown("Rate activities to help the AI learn your preferences!")

# Progress bar
total_activities = len(st.session_state.activities)
rated_count = len([r for r in st.session_state.ratings.values() if r.get('status') != 'skip'])
progress = rated_count / total_activities if total_activities > 0 else 0

col1, col2, col3 = st.columns([2, 1, 1])
with col1:
    st.progress(progress, text=f"Progress: {rated_count}/{total_activities} rated ({progress*100:.1f}%)")
with col2:
    if st.button("⬅️ Previous", disabled=st.session_state.current_index == 0):
        st.session_state.current_index = max(0, st.session_state.current_index - 1)
        st.rerun()
with col3:
    if st.button("Next ➡️", disabled=st.session_state.current_index >= total_activities - 1):
        st.session_state.current_index = min(total_activities - 1, st.session_state.current_index + 1)
        st.rerun()

st.divider()

# Main content
if total_activities == 0:
    st.warning("No activities found. Make sure you've run the seed data SQL files in Supabase.")
else:
    current_activity = st.session_state.activities[st.session_state.current_index]
    activity_id = current_activity['id']

    # Load existing rating if any
    existing_rating = st.session_state.ratings.get(activity_id, {})

    # Activity details
    col_left, col_right = st.columns([1, 1])

    with col_left:
        st.header(f"{current_activity['name']}")
        st.caption(f"Activity {st.session_state.current_index + 1} of {total_activities}")

        st.markdown(f"**Category:** {current_activity.get('category', 'N/A')}")
        st.markdown(f"**Location:** {current_activity.get('city', 'N/A')}")

        if current_activity.get('address'):
            st.markdown(f"**Address:** {current_activity['address']}")

        if current_activity.get('drive_time_minutes'):
            st.markdown(f"**Drive Time:** {current_activity['drive_time_minutes']} minutes from home")

        if current_activity.get('cost_estimate'):
            st.markdown(f"**Cost:** {current_activity['cost_estimate']}")

        if current_activity.get('age_min') and current_activity.get('age_max'):
            st.markdown(f"**Age Range:** {current_activity['age_min']}-{current_activity['age_max']} years")

        if current_activity.get('indoor_outdoor'):
            st.markdown(f"**Type:** {current_activity['indoor_outdoor']}")

        if current_activity.get('tags'):
            tags = ', '.join(current_activity['tags'])
            st.markdown(f"**Tags:** {tags}")

        st.divider()

        if current_activity.get('description'):
            st.markdown("**Description:**")
            st.info(current_activity['description'])

        if current_activity.get('notes'):
            st.markdown("**Notes:**")
            st.warning(current_activity['notes'])

        if current_activity.get('url'):
            st.markdown(f"[🔗 Website]({current_activity['url']})")

    with col_right:
        st.subheader("Rating Form")

        # Visit status
        status = st.radio(
            "Have you been here?",
            options=['skip', 'never', 'heard_of_it', 'visited'],
            format_func=lambda x: {
                'skip': 'Skip (rate later)',
                'never': "Never heard of it",
                'heard_of_it': 'Heard of it',
                'visited': 'Yes, we\'ve been!'
            }[x],
            index=['skip', 'never', 'heard_of_it', 'visited'].index(existing_rating.get('status', 'skip')),
            key=f"status_{activity_id}"
        )

        rating_data = {'status': status}

        if status == 'visited':
            st.divider()
            st.markdown("**📊 Ratings (1-5 stars)**")

            col_3yo, col_5yo, col_overall = st.columns(3)

            with col_3yo:
                rating_3yo = st.select_slider(
                    "3yo enjoyed it",
                    options=[1, 2, 3, 4, 5],
                    value=existing_rating.get('rating_3yo', 3),
                    key=f"rating_3yo_{activity_id}"
                )
                rating_data['rating_3yo'] = rating_3yo

            with col_5yo:
                rating_5yo = st.select_slider(
                    "5yo enjoyed it",
                    options=[1, 2, 3, 4, 5],
                    value=existing_rating.get('rating_5yo', 3),
                    key=f"rating_5yo_{activity_id}"
                )
                rating_data['rating_5yo'] = rating_5yo

            with col_overall:
                rating_overall = st.select_slider(
                    "Overall rating",
                    options=[1, 2, 3, 4, 5],
                    value=existing_rating.get('rating_overall', 3),
                    key=f"rating_overall_{activity_id}"
                )
                rating_data['rating_overall'] = rating_overall

            st.divider()

            # Would return
            would_return = st.checkbox(
                "Would you return?",
                value=existing_rating.get('would_return', True),
                key=f"would_return_{activity_id}"
            )
            rating_data['would_return'] = would_return

            # Last visited
            last_visited = st.date_input(
                "Last visited (approximate)",
                value=datetime.fromisoformat(existing_rating['last_visited']) if existing_rating.get('last_visited') else datetime.now(),
                key=f"last_visited_{activity_id}"
            )
            rating_data['last_visited'] = last_visited.isoformat()

            # Notes
            notes = st.text_area(
                "Notes (what worked, what didn't, tips, etc.)",
                value=existing_rating.get('notes', ''),
                height=100,
                key=f"notes_{activity_id}"
            )
            rating_data['notes'] = notes

        elif status == 'heard_of_it':
            interested = st.checkbox(
                "Interested in trying it?",
                value=existing_rating.get('interested', True),
                key=f"interested_{activity_id}"
            )
            rating_data['interested'] = interested

        # Save button
        if st.button("💾 Save Rating", type="primary", key=f"save_{activity_id}"):
            save_rating(activity_id, rating_data)
            st.success("✅ Rating saved!")

            # Auto-advance to next unrated activity
            next_unrated = None
            for i in range(st.session_state.current_index + 1, total_activities):
                if st.session_state.activities[i]['id'] not in st.session_state.ratings:
                    next_unrated = i
                    break

            if next_unrated:
                st.session_state.current_index = next_unrated
                st.rerun()
            elif st.session_state.current_index < total_activities - 1:
                st.session_state.current_index += 1
                st.rerun()

# Footer actions
st.divider()
col1, col2, col3 = st.columns(3)

with col1:
    if st.button("🔄 Reload Activities"):
        st.session_state.activities = load_activities()
        st.success("Activities reloaded!")
        st.rerun()

with col2:
    if st.button("📤 Push to Supabase", disabled=not SUPABASE_AVAILABLE or not st.session_state.ratings):
        with st.spinner("Pushing ratings to Supabase..."):
            if push_to_supabase():
                st.success(f"✅ Successfully pushed {len(st.session_state.ratings)} ratings to Supabase!")
            else:
                st.warning("No new ratings to push.")

with col3:
    if st.button("🗑️ Clear All Ratings"):
        if st.session_state.ratings:
            st.session_state.ratings = {}
            st.success("All ratings cleared!")
            st.rerun()

# Sidebar stats
with st.sidebar:
    st.header("📊 Rating Stats")
    st.metric("Total Activities", total_activities)
    st.metric("Rated", rated_count)
    st.metric("Remaining", total_activities - rated_count)

    st.divider()

    if st.session_state.ratings:
        st.subheader("Rating Breakdown")
        visited = len([r for r in st.session_state.ratings.values() if r.get('status') == 'visited'])
        heard_of = len([r for r in st.session_state.ratings.values() if r.get('status') == 'heard_of_it'])
        never = len([r for r in st.session_state.ratings.values() if r.get('status') == 'never'])
        skipped = len([r for r in st.session_state.ratings.values() if r.get('status') == 'skip'])

        st.write(f"✅ Visited: {visited}")
        st.write(f"👂 Heard of it: {heard_of}")
        st.write(f"❓ Never heard: {never}")
        st.write(f"⏭️ Skipped: {skipped}")

    st.divider()

    st.markdown("""
    ### 🎯 Tips
    - Rate honestly - this helps the AI learn!
    - Separate ratings for 3yo and 5yo are important
    - Add notes about what worked/didn't work
    - Use keyboard shortcuts:
      - Tab to move between fields
      - Enter to submit
    """)

    st.divider()

    st.caption("Weekend Activity Planner v1.0")
    st.caption("Built with Streamlit + Supabase")
