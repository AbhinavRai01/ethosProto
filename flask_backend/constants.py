
USER_PREDICTION_PROMPT = USER_PREDICTION_PROMPT = """You are a behavioral analyst for a university. Your task is to create a concise, structured narrative of a user's predicted daily schedule based on probabilistic data.

You MUST follow this exact markdown structure:

## Daily Schedule Overview for [User Name]

### 🌅 Morning Routine (12 AM - 7 AM)
[Write a brief paragraph describing their likely morning routine.

### ☀️ Daytime Activities (8 AM - 3 PM)
[Write a brief paragraph covering the main part of their day.

### 🌙 Evening Schedule (4 PM - 12 AM)
[Write a brief paragraph about their evening activities.

### 📊 Activity Patterns
- **Most Frequent Location**: [Location they visit most often]
- **Peak Activity Time**: [Time period when they're most active]
- **Primary Focus**: [e.g., "Academic-focused with regular lab sessions", "Balanced schedule with social activities"]

**Overall Pattern**: [One sentence summarizing their daily routine and behavior]

CRITICAL RULES:
- Use markdown formatting (##, ###, -, **)
- Write in natural, flowing paragraphs for each time period
- DO NOT list individual probability percentages
- Focus on describing patterns and routines qualitatively
- Mention specific campus locations naturally in context
- Keep tone professional but conversational
- Make the narrative cohesive and realistic"""

HEATMAP_HOURLY_PROMPT = """You are a campus operations analyst. Your task is to provide a brief, insightful summary of campus activity based on density data. Focus on the busiest locations and any notable empty areas.
    You MUST follow this exact structure:


- [Brief description of activity pattern]
- [Brief description of activity pattern]  
- [Brief description of activity pattern]"""

HEATMAP_DAILY_PROMPT = """You are a campus spatial forecasting analyst. Your task is to generate a clear, structured markdown summary of predicted daily spatial activity patterns.

You MUST follow this exact structure:

### 🔥 High Traffic Areas
- [Location 1]: [Brief description of activity pattern]
- [Location 2]: [Brief description of activity pattern]  
- [Location 3]: [Brief description of activity pattern]

### 📉 Low Activity Areas
- [Location 1]: [Brief description]
- [Location 2]: [Brief description]

### 🔄 Movement Patterns Throughout the Day
[Describe how the busiest location changes throughout the day. Write 2-3 sentences about the flow of activity from morning to evening, mentioning which locations are busy at what times.]

**Key Insight:** [One sentence highlighting the most interesting pattern or finding]

CRITICAL RULES:
- Use markdown formatting (##, ###, -, **)
- DO NOT mention any specific user counts or numbers
- Focus on qualitative descriptions (busy, quiet, moderate, peak times)
- Describe patterns using time periods (morning, afternoon, evening, late night)
- Keep descriptions concise and insightful"""

HEATMAP_DAILY_QUERY = """Analyze the aggregated daily activity data for {day} ({dept_str}) and provide a formatted markdown summary.

Aggregated data (showing peak hour, peak count, and total users per location):
{daily_data}

Remember: 
- List exactly 3 high traffic areas (most total users)
- List exactly 2 low activity areas (least total users)
- Describe movement patterns focusing on how peak times shift between locations
- Use markdown formatting
- NO specific numbers of users"""

NOTES_MAPPING = {
            'Confirmed attendance for robotics workshop.': 'LAB', 'Wi-Fi not working in hostel block.': 'HOSTEL',
            'CCTV near library needs check.': 'LIBRARY', 'Broken chair in seminar room.': 'SEMINAR_ROOM',
            'Requesting lab access.': 'LAB',
        }

LOCATIONS_MAPPING = {
            'AUD': 'AUDITORIUM', 'AUDITORIUM': 'AUDITORIUM', 'AP_AUD_1': 'AUDITORIUM','AP_AUD_2': 'AUDITORIUM',
            'AP_AUD_3': 'AUDITORIUM', 'AP_AUD_4': 'AUDITORIUM', 'AP_AUD_5': 'AUDITORIUM', 'AP_ADMIN_1':'ADMIN_LOBBY',
            'AP_ADMIN_2':'ADMIN_LOBBY', 'AP_ADMIN_3':'ADMIN_LOBBY', 'AP_ADMIN_4':'ADMIN_LOBBY',
            'AP_ADMIN_5':'ADMIN_LOBBY', 'ADMIN': 'ADMIN_LOBBY', 'ADMIN_LOBBY': 'ADMIN_LOBBY', 'AP_CAF_1': 'CAF',
            'AP_CAF_2': 'CAF', 'AP_CAF_3': 'CAF', 'AP_CAF_4': 'CAF', 'AP_CAF_5': 'CAF', 'CAF': 'CAF', 'CAF_01': 'CAF',
            'AP_LIB_1': 'LIBRARY', 'AP_LIB_2': 'LIBRARY', 'AP_LIB_3': 'LIBRARY', 'AP_LIB_4': 'LIBRARY',
            'AP_LIB_5': 'LIBRARY', 'LIB_ENT': 'LIBRARY', 'LIB': 'LIBRARY', 'LIBRARY': 'LIBRARY', 'AP_HOSTEL_1': 'HOSTEL',
            'AP_HOSTEL_2': 'HOSTEL', 'AP_HOSTEL_3': 'HOSTEL', 'AP_HOSTEL_4': 'HOSTEL', 'AP_HOSTEL_5': 'HOSTEL',
            'HOSTEL': 'HOSTEL', 'HOSTEL_GATE': 'HOSTEL', 'AP_LAB_1': 'LAB', 'AP_LAB_2': 'LAB', 'AP_LAB_3': 'LAB',
            'AP_LAB_4': 'LAB', 'AP_LAB_5': 'LAB', 'LAB': 'LAB', 'LAB_101': 'LAB', 'AP_ENG_1': 'ENG', 'AP_ENG_2': 'ENG',
            'AP_ENG_3': 'ENG', 'AP_ENG_4': 'ENG', 'AP_ENG_5': 'ENG', 'ENG': 'ENG', 'LAB_305': 'LAB', 'GYM': 'GYM',
            'SEM_01': 'SEMINAR_ROOM', 'SEMINAR ROOM': 'SEMINAR_ROOM', 'LAB_102': 'LAB', 'ROOM_A1': 'SEMINAR_ROOM',
            'ROOM_A2': 'SEMINAR_ROOM',
        }