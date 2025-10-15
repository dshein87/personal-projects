"""
Weekend Activity Planner - Bootstrap Rating UI

Fast binary rating system with keyboard shortcuts.

New Rating Model:
1. Does 3yo like it? (Y/N)
2. Does 5yo like it? (Y/N)
3. Do you want to go again? (Y/N)

Keyboard Shortcuts:
- Y = Yes for current question
- N = No for current question
- S = Skip this activity
- Enter/Space = Next activity
- ← → = Navigate between activities
- Tab = Switch between questions
"""

import streamlit as st
import os
from datetime import datetime
from dotenv import load_dotenv
from st_keyup import st_keyup

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

# Custom CSS for keyboard shortcuts and better UX
st.markdown("""
<style>
    .big-button {
        font-size: 24px !important;
        padding: 20px !important;
        margin: 10px 0 !important;
    }
    .question-text {
        font-size: 22px;
        font-weight: bold;
        margin: 20px 0 10px 0;
    }
    .shortcut-hint {
        color: #888;
        font-size: 14px;
        font-style: italic;
    }
    .activity-name {
        font-size: 32px;
        font-weight: bold;
        color: #1E88E5;
    }
    .rating-summary {
        background-color: #f0f0f0;
        padding: 15px;
        border-radius: 8px;
        margin: 10px 0;
    }
</style>
""", unsafe_allow_html=True)

# Initialize session state
if 'current_index' not in st.session_state:
    st.session_state.current_index = 0
if 'activities' not in st.session_state:
    st.session_state.activities = []
if 'ratings' not in st.session_state:
    st.session_state.ratings = {}
if 'loaded' not in st.session_state:
    st.session_state.loaded = False
if 'current_question' not in st.session_state:
    st.session_state.current_question = 1  # 1=3yo, 2=5yo, 3=would_return
if 'temp_answers' not in st.session_state:
    st.session_state.temp_answers = {}


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
    """Save rating to session state"""
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
                    'liked_by_3yo': rating.get('liked_by_3yo'),
                    'liked_by_5yo': rating.get('liked_by_5yo'),
                    'would_return': rating.get('would_return'),
                    'notes': rating.get('notes', ''),
                }
                visits_to_insert.append(visit)

        if visits_to_insert:
            supabase.table('visits').insert(visits_to_insert).execute()
            return True
        return False
    except Exception as e:
        st.error(f"Error pushing to Supabase: {e}")
        return False


def auto_advance():
    """Auto-advance to next unrated activity or just next"""
    total_activities = len(st.session_state.activities)

    # Find next unrated
    for i in range(st.session_state.current_index + 1, total_activities):
        if st.session_state.activities[i]['id'] not in st.session_state.ratings:
            st.session_state.current_index = i
            st.rerun()
            return

    # No unrated found, just go to next
    if st.session_state.current_index < total_activities - 1:
        st.session_state.current_index += 1
        st.rerun()


# Load activities on first run
if not st.session_state.loaded:
    with st.spinner("Loading activities from database..."):
        st.session_state.activities = load_activities()
        st.session_state.loaded = True

# Header
st.title("⚡ Fast Activity Rating")
st.markdown("**Binary ratings + keyboard shortcuts = blazing fast workflow!**")

# Progress bar
total_activities = len(st.session_state.activities)
rated_count = len([r for r in st.session_state.ratings.values() if r.get('status') != 'skip'])
progress = rated_count / total_activities if total_activities > 0 else 0

col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
with col1:
    st.progress(progress, text=f"Progress: {rated_count}/{total_activities} rated ({progress*100:.0f}%)")
with col2:
    if st.button("⬅️ Prev", disabled=st.session_state.current_index == 0):
        st.session_state.current_index = max(0, st.session_state.current_index - 1)
        st.rerun()
with col3:
    if st.button("Next ➡️", disabled=st.session_state.current_index >= total_activities - 1):
        st.session_state.current_index = min(total_activities - 1, st.session_state.current_index + 1)
        st.rerun()
with col4:
    if st.button("⏭️ Skip", key="skip_button"):
        activity_id = st.session_state.activities[st.session_state.current_index]['id']
        save_rating(activity_id, {'status': 'skip'})
        auto_advance()

st.divider()

# Keyboard shortcut listener (invisible input that captures keypresses)
with st.sidebar:
    key_pressed = st_keyup("Press Y/N to answer, S to skip, ←→ to navigate", key="keyboard_listener")

    if key_pressed:
        key = key_pressed.lower()

        # Handle navigation keys
        if key == 'arrowright' and st.session_state.current_index < total_activities - 1:
            st.session_state.current_index += 1
            st.rerun()
        elif key == 'arrowleft' and st.session_state.current_index > 0:
            st.session_state.current_index -= 1
            st.rerun()
        elif key == 's':  # Skip
            activity_id = st.session_state.activities[st.session_state.current_index]['id']
            save_rating(activity_id, {'status': 'skip'})
            auto_advance()

# Main content
if total_activities == 0:
    st.warning("No activities found. Make sure you've run the seed data SQL files in Supabase.")
else:
    current_activity = st.session_state.activities[st.session_state.current_index]
    activity_id = current_activity['id']

    # Load existing rating if any
    existing_rating = st.session_state.ratings.get(activity_id, {})

    # Initialize temp answers for this activity if not exists
    if activity_id not in st.session_state.temp_answers:
        st.session_state.temp_answers[activity_id] = existing_rating.copy() if existing_rating else {}

    # Get current temp answers
    temp_rating = st.session_state.temp_answers[activity_id]

    # Two-column layout
    col_left, col_right = st.columns([1.2, 1])

    with col_left:
        # Activity details
        st.markdown(f"<div class='activity-name'>{current_activity['name']}</div>", unsafe_allow_html=True)
        st.caption(f"Activity {st.session_state.current_index + 1} of {total_activities}")

        # Key info in columns
        info_col1, info_col2, info_col3 = st.columns(3)
        with info_col1:
            st.markdown(f"**📍** {current_activity.get('city', 'N/A')}")
            if current_activity.get('drive_time_minutes'):
                st.markdown(f"**🚗** {current_activity['drive_time_minutes']} min")
        with info_col2:
            st.markdown(f"**📂** {current_activity.get('category', 'N/A')}")
            if current_activity.get('indoor_outdoor'):
                st.markdown(f"**🏠** {current_activity['indoor_outdoor']}")
        with info_col3:
            st.markdown(f"**💰** {current_activity.get('cost_estimate', 'N/A')}")
            if current_activity.get('age_min') and current_activity.get('age_max'):
                st.markdown(f"**👶** {current_activity['age_min']}-{current_activity['age_max']} yrs")

        st.divider()

        if current_activity.get('description'):
            st.markdown("**Description:**")
            st.info(current_activity['description'])

        if current_activity.get('address'):
            st.markdown(f"**Address:** {current_activity['address']}")

        if current_activity.get('tags'):
            tags = ', '.join(current_activity['tags'])
            st.markdown(f"**Tags:** {tags}")

        if current_activity.get('notes'):
            with st.expander("📝 Additional Notes"):
                st.warning(current_activity['notes'])

        if current_activity.get('url'):
            st.markdown(f"[🔗 Visit Website]({current_activity['url']})")

    with col_right:
        st.subheader("⭐ Rate This Activity")

        # Visit status
        status_options = {
            'skip': '⏭️ Skip (rate later)',
            'never': '❓ Never heard of it',
            'visited': '✅ Been there!'
        }

        status = st.radio(
            "Have you visited this activity?",
            options=list(status_options.keys()),
            format_func=lambda x: status_options[x],
            index=list(status_options.keys()).index(temp_rating.get('status', 'skip')),
            key=f"status_{activity_id}",
            horizontal=True
        )

        # Update temp state with status
        if temp_rating.get('status') != status:
            st.session_state.temp_answers[activity_id]['status'] = status
            st.rerun()

        rating_data = {'status': status}

        # If visited, show the three binary questions
        if status == 'visited':
            st.divider()
            st.markdown("### 🎯 Three Simple Questions")

            # Question 1: 3yo
            st.markdown("<div class='question-text'>1️⃣ Does 3yo like it?</div>", unsafe_allow_html=True)
            q1_col1, q1_col2 = st.columns(2)
            with q1_col1:
                if st.button("👍 YES", key=f"3yo_yes_{activity_id}", use_container_width=True,
                            type="primary" if temp_rating.get('liked_by_3yo') == True else "secondary"):
                    st.session_state.temp_answers[activity_id]['liked_by_3yo'] = True
                    st.rerun()
            with q1_col2:
                if st.button("👎 NO", key=f"3yo_no_{activity_id}", use_container_width=True,
                            type="primary" if temp_rating.get('liked_by_3yo') == False else "secondary"):
                    st.session_state.temp_answers[activity_id]['liked_by_3yo'] = False
                    st.rerun()

            # Load answer from temp state
            if 'liked_by_3yo' in temp_rating:
                rating_data['liked_by_3yo'] = temp_rating['liked_by_3yo']
                answer_text = "✅ Yes" if temp_rating['liked_by_3yo'] else "❌ No"
                st.markdown(f"<span style='color: green; font-weight: bold;'>Answer: {answer_text}</span>", unsafe_allow_html=True)

            st.markdown("---")

            # Question 2: 5yo
            st.markdown("<div class='question-text'>2️⃣ Does 5yo like it?</div>", unsafe_allow_html=True)
            q2_col1, q2_col2 = st.columns(2)
            with q2_col1:
                if st.button("👍 YES", key=f"5yo_yes_{activity_id}", use_container_width=True,
                            type="primary" if temp_rating.get('liked_by_5yo') == True else "secondary"):
                    st.session_state.temp_answers[activity_id]['liked_by_5yo'] = True
                    st.rerun()
            with q2_col2:
                if st.button("👎 NO", key=f"5yo_no_{activity_id}", use_container_width=True,
                            type="primary" if temp_rating.get('liked_by_5yo') == False else "secondary"):
                    st.session_state.temp_answers[activity_id]['liked_by_5yo'] = False
                    st.rerun()

            # Load answer from temp state
            if 'liked_by_5yo' in temp_rating:
                rating_data['liked_by_5yo'] = temp_rating['liked_by_5yo']
                answer_text = "✅ Yes" if temp_rating['liked_by_5yo'] else "❌ No"
                st.markdown(f"<span style='color: green; font-weight: bold;'>Answer: {answer_text}</span>", unsafe_allow_html=True)

            st.markdown("---")

            # Question 3: Would return
            st.markdown("<div class='question-text'>3️⃣ Do you want to go again?</div>", unsafe_allow_html=True)
            q3_col1, q3_col2 = st.columns(2)
            with q3_col1:
                if st.button("👍 YES", key=f"return_yes_{activity_id}", use_container_width=True,
                            type="primary" if temp_rating.get('would_return') == True else "secondary"):
                    st.session_state.temp_answers[activity_id]['would_return'] = True
                    st.rerun()
            with q3_col2:
                if st.button("👎 NO", key=f"return_no_{activity_id}", use_container_width=True,
                            type="primary" if temp_rating.get('would_return') == False else "secondary"):
                    st.session_state.temp_answers[activity_id]['would_return'] = False
                    st.rerun()

            # Load answer from temp state
            if 'would_return' in temp_rating:
                rating_data['would_return'] = temp_rating['would_return']
                answer_text = "✅ Yes" if temp_rating['would_return'] else "❌ No"
                st.markdown(f"<span style='color: green; font-weight: bold;'>Answer: {answer_text}</span>", unsafe_allow_html=True)

            st.divider()

            # Last visited date
            last_visited = st.date_input(
                "📅 Last visited (approximate)",
                value=datetime.fromisoformat(temp_rating['last_visited']) if temp_rating.get('last_visited') else datetime.now(),
                key=f"last_visited_{activity_id}"
            )
            rating_data['last_visited'] = last_visited.isoformat()

            # Notes
            notes = st.text_area(
                "📝 Notes (optional - what worked, what didn't, tips, etc.)",
                value=temp_rating.get('notes', ''),
                height=80,
                key=f"notes_{activity_id}",
                placeholder="e.g., 'Great for bikes', 'Too crowded on weekends', 'Best in the morning'"
            )
            rating_data['notes'] = notes

            st.divider()

            # Save button - only show if all three questions answered
            all_answered = (
                'liked_by_3yo' in rating_data and
                'liked_by_5yo' in rating_data and
                'would_return' in rating_data
            )

            if all_answered:
                if st.button("💾 SAVE & NEXT", type="primary", key=f"save_{activity_id}", use_container_width=True):
                    save_rating(activity_id, rating_data)
                    st.success("✅ Rating saved!")
                    auto_advance()
            else:
                st.warning("⚠️ Please answer all three questions to save")

        elif status == 'never':
            # Just save and move on
            if st.button("Continue to Next →", key=f"continue_{activity_id}", type="primary"):
                save_rating(activity_id, rating_data)
                auto_advance()

        elif status == 'skip':
            # Just save and move on
            if st.button("Continue to Next →", key=f"continue_skip_{activity_id}", type="primary"):
                save_rating(activity_id, rating_data)
                auto_advance()

# Footer actions
st.divider()
col1, col2, col3, col4 = st.columns(4)

with col1:
    if st.button("🔄 Reload Activities"):
        st.session_state.activities = load_activities()
        st.success("Activities reloaded!")
        st.rerun()

with col2:
    visited_count = len([r for r in st.session_state.ratings.values() if r.get('status') == 'visited'])
    if st.button(f"📤 Push {visited_count} to Supabase", disabled=not SUPABASE_AVAILABLE or visited_count == 0):
        with st.spinner("Pushing ratings to Supabase..."):
            if push_to_supabase():
                st.success(f"✅ Successfully pushed {visited_count} ratings!")
            else:
                st.warning("No new ratings to push.")

with col3:
    if st.button("🗑️ Clear All Ratings"):
        if st.session_state.ratings:
            st.session_state.ratings = {}
            st.success("All ratings cleared!")
            st.rerun()

with col4:
    # Jump to first unrated
    unrated_indices = [i for i, act in enumerate(st.session_state.activities)
                       if act['id'] not in st.session_state.ratings]
    if unrated_indices and st.button("🎯 Jump to First Unrated"):
        st.session_state.current_index = unrated_indices[0]
        st.rerun()

# Sidebar stats
with st.sidebar:
    st.header("📊 Progress")
    st.metric("Total Activities", total_activities)
    st.metric("Rated", rated_count)
    st.metric("Remaining", total_activities - rated_count)

    st.divider()

    if st.session_state.ratings:
        st.subheader("Rating Breakdown")
        visited = len([r for r in st.session_state.ratings.values() if r.get('status') == 'visited'])
        never = len([r for r in st.session_state.ratings.values() if r.get('status') == 'never'])
        skipped = len([r for r in st.session_state.ratings.values() if r.get('status') == 'skip'])

        st.write(f"✅ **Visited:** {visited}")
        st.write(f"❓ **Never heard:** {never}")
        st.write(f"⏭️ **Skipped:** {skipped}")

        # Show some stats about visited activities
        if visited > 0:
            st.divider()
            st.subheader("Visit Stats")
            liked_3yo = len([r for r in st.session_state.ratings.values()
                           if r.get('status') == 'visited' and r.get('liked_by_3yo') == True])
            liked_5yo = len([r for r in st.session_state.ratings.values()
                           if r.get('status') == 'visited' and r.get('liked_by_5yo') == True])
            would_return = len([r for r in st.session_state.ratings.values()
                              if r.get('status') == 'visited' and r.get('would_return') == True])

            st.write(f"👶 **3yo liked:** {liked_3yo}/{visited}")
            st.write(f"👧 **5yo liked:** {liked_5yo}/{visited}")
            st.write(f"🔄 **Would return:** {would_return}/{visited}")

    st.divider()

    st.markdown("""
    ### ⚡ Keyboard Shortcuts ✅

    **NOW ACTIVE!**
    - `→` = Next activity
    - `←` = Previous activity
    - `S` = Skip activity

    **Click the input field above, then use:**
    - Just type `Y` or `N` when answering
    - Press `S` to skip
    - Use arrow keys to navigate

    *Tip: Click the keyboard input above first!*
    """)

    st.divider()

    st.markdown("""
    ### 🎯 Tips

    - **Be honest!** This helps the AI learn your actual preferences
    - **Different kids, different tastes** - The 3yo and 5yo questions capture this
    - **"Would return" = overall verdict** - The most important signal
    - **Notes are gold** - Future you will thank you
    - **Skip if unsure** - Better to skip than guess
    """)

    st.divider()

    st.caption("Weekend Activity Planner v2.0")
    st.caption("Binary Ratings + Fast Workflow")
    st.caption("Built with Streamlit + Supabase")
