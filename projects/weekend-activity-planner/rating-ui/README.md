# Weekend Activity Planner - Rating UI

**Bootstrap rating interface for initial activity feedback**

This Streamlit app provides a fast, visual interface for rating the ~75 seeded activities to bootstrap the recommendation system.

---

## Features

- 📊 Visual activity rating interface
- ⭐ Separate ratings for 3yo and 5yo
- 📝 Notes and feedback capture
- 💾 Local caching before Supabase push
- 🎯 Progress tracking
- ⌨️ Keyboard navigation
- 🔄 Auto-advance to next unrated activity

---

## Setup

### 1. Install Dependencies

```bash
cd rating-ui
pip install -r requirements.txt
```

### 2. Configure Environment

Make sure `../.env` has Supabase credentials:
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=[your-supabase-anon-key]
```

### 3. Run the App

```bash
streamlit run streamlit_app.py
```

The app will open in your browser at `http://localhost:8501`

---

## Usage

### Rating Workflow

1. **Load activities** - App loads from Supabase on startup
2. **Review activity details** - Left panel shows full information
3. **Select visit status:**
   - **Skip**: Rate later
   - **Never heard of it**: Mark as new discovery
   - **Heard of it**: Mark as interested (or not)
   - **Visited**: Provide full ratings

4. **If visited, provide:**
   - Rating for 3yo (1-5 stars)
   - Rating for 5yo (1-5 stars)
   - Overall rating (1-5 stars)
   - Would you return? (checkbox)
   - Last visited (approximate date)
   - Notes (what worked, what didn't)

5. **Save rating** - Click "Save Rating" button
6. **Auto-advance** - App jumps to next unrated activity

### Navigation

- **Previous/Next buttons** - Navigate through activities
- **Progress bar** - Track completion
- **Sidebar stats** - See rating breakdown

### Completing the Session

1. Rate all (or most) activities
2. Click **"Push to Supabase"** to save to database
3. Ratings are saved as `visits` records in Supabase

---

## Data Flow

```
Supabase activities table
    ↓ (load on startup)
Streamlit app (session state)
    ↓ (rate activities)
Local session storage
    ↓ (push when ready)
Supabase visits table
```

---

## Tips for Rating

### Be Specific
- Separate 3yo and 5yo ratings are important!
- A 3-year-old and 5-year-old have very different interests
- This helps the AI suggest age-appropriate activities

### Add Context in Notes
Good notes examples:
- "Kids loved the trains but playground was too advanced for 3yo"
- "Great for sunny days but no shade"
- "Parking was difficult on weekends"
- "Bring old clothes - gets very messy!"

### Use "Heard of It" Strategically
- Mark activities you're interested in trying
- This helps prioritize new suggestions

### Don't Skip Everything
- Try to rate at least 30-40 activities
- The more data, the better the AI recommendations

---

## Keyboard Shortcuts

- **Tab**: Move between fields
- **Enter**: Submit form (in some browsers)
- **Arrow keys**: Navigate select sliders

---

## Troubleshooting

### Activities Not Loading

**Problem:** "No activities found" message

**Solutions:**
1. Check Supabase credentials in `../.env`
2. Verify you've run `database/seed-activities.sql` in Supabase
3. Check Supabase dashboard to confirm activities table has data

### Can't Push to Supabase

**Problem:** Error when clicking "Push to Supabase"

**Solutions:**
1. Verify Supabase credentials
2. Check that visits table exists in Supabase
3. Check browser console for error details

### App is Slow

**Solutions:**
1. Close other browser tabs
2. Refresh the page
3. Check internet connection (pulls from Supabase)

---

## Data Storage

### Session State (In-Memory)
- Ratings stored in Streamlit session state
- **Lost if you close browser/tab**
- Always click "Push to Supabase" before closing!

### Supabase (Permanent)
- Ratings pushed to `visits` table
- Permanent storage
- Can re-run rating session without losing data

---

## After Bootstrap Rating

Once you've rated activities:

1. **Push to Supabase** - Critical!
2. **Verify in Supabase** - Check visits table has records
3. **MCP servers can now use ratings** - Activity Planner will query visits for preferences
4. **Run the system** - Weekly suggestions will use your ratings

---

## Next Steps

After bootstrap rating:
1. Continue with MCP server setup
2. Configure n8n workflows
3. Test recommendation engine
4. Start getting weekly suggestions!

---

**Estimated time for bootstrap rating:** 30-45 minutes for ~75 activities

**Tip:** You don't need to rate everything in one session. Rate the important ones first (places you've actually been), then fill in others later.
