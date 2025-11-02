#!/usr/bin/env python3
"""
Weekend Activity Planner - Conversational Dashboard

Email → Magic Link → This Dashboard → Claude API + Tools → Supabase

Architecture:
- Streamlit chat UI
- Claude 4.5 Sonnet with function calling (tool integration)
- Real-time database queries via tools
- Conversation persistence
- Magic link security (7-day expiration)
"""

import streamlit as st
from anthropic import Anthropic
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime
import json

# Load environment variables from project root
load_dotenv('../.env')

# Configuration
st.set_page_config(
    page_title="Weekend Activity Planner",
    page_icon="🎉",
    layout="centered",
    initial_sidebar_state="collapsed"
)

# Initialize clients (cached for performance)
@st.cache_resource
def get_clients():
    """Initialize Supabase and Anthropic clients"""
    supabase = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Server-side key for admin operations
    )
    anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
    return supabase, anthropic

supabase, anthropic = get_clients()

# Constants
CLAUDE_MODEL = "claude-sonnet-4-5-20250929"  # Sonnet 4.5 (latest)
SYSTEM_PROMPT = """You are a helpful weekend activity planning assistant for a family in Oakland, CA with kids ages 3 and 5.

**Your capabilities:**
- Search for activities by weather, indoor/outdoor preference, drive time, etc.
- Find dietary-safe restaurants (celiac + allergen-aware)
- Check weather forecasts
- Look up visit history and past ratings
- Answer questions about activities and help plan detailed itineraries

**Important family context:**
- Family lives in Oakland 94611 (Montclair neighborhood)
- Prefer activities within 30 minutes drive (can go up to 90 min for special occasions)
- Wife has celiac disease (MUST be gluten-free)
- Daughter has allergens: sesame, cashew, flax
- All restaurant suggestions MUST account for these restrictions

**When user shares feedback:**
1. Acknowledge warmly and show enthusiasm
2. Ask clarifying questions (did both kids enjoy it? what did they like most?)
3. Use this feedback to improve future suggestions

**When user asks questions:**
1. Use your tools to look up real data from the database
2. Provide specific, helpful answers with details
3. Consider their preferences and past experiences

Be conversational, friendly, and proactive about using your tools to provide accurate information!"""

# Tool definitions for Claude API
TOOLS = [
    {
        "name": "query_activities",
        "description": "Search for activities in the Oakland/East Bay area. Use this when user asks about activities, wants suggestions, or asks 'what can we do?'. Filters by age range, weather suitability, indoor/outdoor preference, and drive time.",
        "input_schema": {
            "type": "object",
            "properties": {
                "indoor_outdoor": {
                    "type": "string",
                    "enum": ["indoor", "outdoor", "both"],
                    "description": "Filter by indoor/outdoor activities. Use 'both' if not specified."
                },
                "max_drive_minutes": {
                    "type": "number",
                    "description": "Maximum drive time in minutes. Default is 30, max is 90.",
                    "default": 30
                },
                "min_rating": {
                    "type": "number",
                    "description": "Minimum average rating (1-5 scale). Default is 3.5 for quality activities.",
                    "default": 3.5
                },
                "limit": {
                    "type": "number",
                    "description": "Maximum number of activities to return. Default is 10.",
                    "default": 10
                }
            }
        }
    },
    {
        "name": "find_restaurants",
        "description": "Find dietary-safe restaurants near activities or in specific cities. CRITICAL: All restaurants are pre-filtered for celiac safety. Use this when user asks about food options or restaurants.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City to search in (e.g., 'Oakland', 'Berkeley'). Leave empty to search all.",
                },
                "cuisine": {
                    "type": "string",
                    "description": "Cuisine type (e.g., 'mexican', 'italian', 'asian'). Leave empty for all cuisines.",
                },
                "max_drive_minutes": {
                    "type": "number",
                    "description": "Maximum drive time in minutes. Default is 30.",
                    "default": 30
                },
                "limit": {
                    "type": "number",
                    "description": "Maximum number of restaurants to return. Default is 5.",
                    "default": 5
                }
            }
        }
    },
    {
        "name": "get_visit_history",
        "description": "Look up past visits and ratings. Use this when user asks 'where have we been?' or 'what did we do before?' or shares feedback about a visit.",
        "input_schema": {
            "type": "object",
            "properties": {
                "activity_name": {
                    "type": "string",
                    "description": "Search for visits to a specific activity by name (e.g., 'Frog Park'). Leave empty to get all recent visits.",
                },
                "limit": {
                    "type": "number",
                    "description": "Maximum number of visits to return. Default is 20.",
                    "default": 20
                }
            }
        }
    },
    {
        "name": "get_weather_forecast",
        "description": "Get the current weather and forecast for Oakland/East Bay area. Use this when planning outdoor activities or user asks about weather.",
        "input_schema": {
            "type": "object",
            "properties": {}
        }
    }
]

# Tool implementation functions
def query_activities(indoor_outdoor="both", max_drive_minutes=30, min_rating=3.5, limit=10):
    """Query activities from database with filters"""
    try:
        query = supabase.table('activities').select('*')

        # Apply filters
        if indoor_outdoor != "both":
            query = query.eq('indoor_outdoor', indoor_outdoor)

        query = query.lte('drive_time_minutes', max_drive_minutes)
        query = query.gte('avg_rating', min_rating)

        # Age range filter (kids ages 3-5)
        query = query.lte('age_min', 3)
        query = query.gte('age_max', 5)

        # Order by rating and limit
        query = query.order('avg_rating', desc=True).limit(limit)

        result = query.execute()

        # Format results for Claude
        activities = []
        for act in result.data:
            activities.append({
                "id": act['id'],
                "name": act['name'],
                "city": act['city'],
                "description": act.get('description', 'No description available'),
                "drive_time": f"{act['drive_time_minutes']} minutes",
                "indoor_outdoor": act['indoor_outdoor'],
                "rating": act.get('avg_rating', 'Not rated yet'),
                "times_visited": act.get('times_visited', 0)
            })

        return {
            "success": True,
            "count": len(activities),
            "activities": activities
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def find_restaurants(city=None, cuisine=None, max_drive_minutes=30, limit=5):
    """Find dietary-safe restaurants"""
    try:
        query = supabase.table('restaurants').select('*')

        # All restaurants are pre-filtered for celiac safety
        query = query.eq('celiac_safe', True)
        query = query.eq('sesame_free_options', True)
        query = query.eq('cashew_free_options', True)
        query = query.eq('flax_free_options', True)

        # Apply optional filters
        if city:
            query = query.eq('city', city)
        if cuisine:
            query = query.eq('cuisine', cuisine.lower())

        query = query.lte('drive_time_minutes', max_drive_minutes)
        query = query.order('avg_rating', desc=True).limit(limit)

        result = query.execute()

        # Format results
        restaurants = []
        for rest in result.data:
            restaurants.append({
                "id": rest['id'],
                "name": rest['name'],
                "city": rest['city'],
                "cuisine": rest['cuisine'],
                "drive_time": f"{rest['drive_time_minutes']} minutes",
                "rating": rest.get('avg_rating', 'Not rated yet'),
                "celiac_notes": rest.get('celiac_notes', 'Safe for celiac')
            })

        return {
            "success": True,
            "count": len(restaurants),
            "restaurants": restaurants
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_visit_history(activity_name=None, limit=20):
    """Look up past visits and ratings"""
    try:
        query = supabase.table('visits').select('*, activities(name, city)')

        # Filter by activity name if provided
        if activity_name:
            # Join with activities table and filter
            query = query.filter('activities.name', 'ilike', f'%{activity_name}%')

        query = query.order('visited_at', desc=True).limit(limit)
        result = query.execute()

        # Format results
        visits = []
        for visit in result.data:
            activity_info = visit.get('activities', {})
            visits.append({
                "activity_name": activity_info.get('name', 'Unknown'),
                "city": activity_info.get('city', 'Unknown'),
                "visited_at": visit['visited_at'],
                "rating_3yo": visit.get('rating_3yo', 'Not rated'),
                "rating_5yo": visit.get('rating_5yo', 'Not rated'),
                "rating_overall": visit.get('rating_overall', 'Not rated'),
                "notes": visit.get('notes', 'No notes')
            })

        return {
            "success": True,
            "count": len(visits),
            "visits": visits
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

def get_weather_forecast():
    """Get weather forecast for Oakland area (stub for now)"""
    # TODO: Integrate with Weather.gov API or similar
    return {
        "success": True,
        "message": "Weather integration coming soon! For now, please check your weather app.",
        "location": "Oakland, CA 94611"
    }

# Map tool names to functions
TOOL_FUNCTIONS = {
    "query_activities": query_activities,
    "find_restaurants": find_restaurants,
    "get_visit_history": get_visit_history,
    "get_weather_forecast": get_weather_forecast
}

# Magic link and conversation functions
def validate_magic_link(conv_id: str) -> bool:
    """Validate magic link token exists and hasn't expired"""
    try:
        result = supabase.table('conversation_tokens')\
            .select('*')\
            .eq('conv_id', conv_id)\
            .gte('expires_at', datetime.now().isoformat())\
            .execute()

        if result.data:
            # Mark token as used (optional tracking)
            supabase.table('conversation_tokens')\
                .update({'used': True})\
                .eq('conv_id', conv_id)\
                .execute()
            return True
        return False
    except Exception as e:
        st.error(f"Error validating link: {str(e)}")
        return False

def load_conversation_history(conv_id: str) -> list:
    """Load all messages for this conversation"""
    try:
        result = supabase.table('conversations')\
            .select('*')\
            .eq('conversation_id', conv_id)\
            .order('created_at', desc=False)\
            .execute()

        return result.data if result.data else []
    except Exception as e:
        st.error(f"Error loading history: {str(e)}")
        return []

def save_message(conv_id: str, role: str, content: str, metadata: dict = None):
    """Save a message to the conversation"""
    try:
        supabase.table('conversations').insert({
            'conversation_id': conv_id,
            'role': role,
            'content': content,
            'metadata': metadata or {}
        }).execute()
    except Exception as e:
        st.error(f"Error saving message: {str(e)}")

def call_claude_with_tools(messages: list) -> tuple:
    """
    Call Claude API with tool support.
    Returns: (final_response_text, tool_calls_made)
    """
    tool_calls_made = []
    conversation_messages = messages.copy()

    while True:
        try:
            # Call Claude with tools
            response = anthropic.messages.create(
                model=CLAUDE_MODEL,
                max_tokens=4096,
                system=SYSTEM_PROMPT,
                tools=TOOLS,
                messages=conversation_messages
            )

            # Check if Claude wants to use a tool
            if response.stop_reason == "tool_use":
                # Process tool calls
                for content_block in response.content:
                    if content_block.type == "tool_use":
                        tool_name = content_block.name
                        tool_input = content_block.input
                        tool_use_id = content_block.id

                        # Execute the tool
                        tool_func = TOOL_FUNCTIONS.get(tool_name)
                        if tool_func:
                            tool_result = tool_func(**tool_input)
                            tool_calls_made.append({
                                "tool": tool_name,
                                "input": tool_input,
                                "result": tool_result
                            })
                        else:
                            tool_result = {"error": f"Tool {tool_name} not found"}

                        # Add assistant's tool use to conversation
                        conversation_messages.append({
                            "role": "assistant",
                            "content": response.content
                        })

                        # Add tool result to conversation
                        conversation_messages.append({
                            "role": "user",
                            "content": [{
                                "type": "tool_result",
                                "tool_use_id": tool_use_id,
                                "content": json.dumps(tool_result)
                            }]
                        })

                # Continue the conversation loop (Claude will now respond with the tool results)
                continue

            else:
                # Claude is done - extract final text response
                final_text = ""
                for content_block in response.content:
                    if hasattr(content_block, "text"):
                        final_text += content_block.text

                return final_text, tool_calls_made

        except Exception as e:
            return f"Sorry, I encountered an error: {str(e)}", tool_calls_made

# Main UI
st.title("🎉 Weekend Activity Planner")

# Get conversation ID from URL
conv_id = st.query_params.get('conv_id')

if not conv_id:
    st.error("🔒 Invalid link. Please use the link from your email.")
    st.info("Each weekly suggestion email contains a unique link to this dashboard.")
    st.stop()

# Validate magic link
if not validate_magic_link(conv_id):
    st.error("🔒 This link has expired or is invalid.")
    st.info("Links expire after 7 days. Please check your latest email for a new link.")
    st.stop()

# Load conversation history
messages = load_conversation_history(conv_id)

# Display conversation
if messages:
    for msg in messages:
        role = msg['role']
        content = msg['content']
        avatar = "🤖" if role == "assistant" else "👤"

        with st.chat_message(role, avatar=avatar):
            st.markdown(content)

            # Show tool calls if present in metadata
            if msg.get('metadata', {}).get('tool_calls'):
                with st.expander("🔧 View tools used", expanded=False):
                    for tool_call in msg['metadata']['tool_calls']:
                        st.caption(f"**{tool_call['tool']}**")
                        st.json(tool_call['input'])
else:
    # No messages yet - show welcome
    st.info("👋 Welcome! This is your personalized activity planning dashboard. Start chatting below!")

# Chat input
if prompt := st.chat_input("Ask questions or share feedback..."):
    # Display user message immediately
    with st.chat_message("user", avatar="👤"):
        st.markdown(prompt)

    # Save user message
    save_message(conv_id, "user", prompt)

    # Build message history for Claude (only user/assistant text)
    history = []
    for m in messages:
        history.append({"role": m['role'], "content": m['content']})
    history.append({"role": "user", "content": prompt})

    # Call Claude with tools
    with st.spinner("Thinking..."):
        response, tool_calls = call_claude_with_tools(history)

    # Display assistant response
    with st.chat_message("assistant", avatar="🤖"):
        st.markdown(response)

        # Show tool calls if any were made
        if tool_calls:
            with st.expander("🔧 View tools used", expanded=False):
                for tool_call in tool_calls:
                    st.caption(f"**{tool_call['tool']}**")
                    st.json(tool_call['input'])

    # Save assistant response with tool metadata
    save_message(conv_id, "assistant", response, metadata={"tool_calls": tool_calls})

    # Rerun to update UI with saved messages
    st.rerun()

# Footer
st.markdown("---")
st.caption("🤖 Powered by Claude 4.5 Sonnet • 🗄️ Data stored securely in Supabase")
