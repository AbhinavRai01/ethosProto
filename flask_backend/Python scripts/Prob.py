#!/usr/bin/env python
# coding: utf-8

# In[9]:


import sklearn
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
get_ipython().run_line_magic('matplotlib', 'inline')
from datetime import datetime, timedelta


# In[40]:


df_cctv=pd.read_csv("Test_Dataset/cctv_frames.csv")
df_face=pd.read_csv("Test_Dataset/face_embeddings.csv")
df_lab=pd.read_csv("Test_Dataset/lab_bookings.csv")
df_lib=pd.read_csv("Test_Dataset/library_checkouts.csv")
df_profiles=pd.read_csv("Test_Dataset/student or staff profiles.csv")
df_card=pd.read_csv("Test_Dataset/campus card_swipes.csv")
df_wifi=pd.read_csv("Test_Dataset/wifi_associations_logs.csv")
df_notes=pd.read_csv("Test_Dataset/free_text_notes (helpdesk or RSVPs).csv")


# In[ ]:


import warnings
warnings.filterwarnings('ignore')
from datetime import datetime, timedelta
import pandas as pd
import numpy as np

TARGET_ENTITY_ID = 'E104567'  # Entity ID to predict
TARGET_DAY_OF_WEEK = 'Wednesday'  

TIME_INTERVAL_MINUTES = 60  
START_DATE = '2025-08-25'  # Monday (first date of training period)
END_DATE = '2025-09-27'  # Last date of training period

# Prediction tuning parameters
LOW_ACTIVITY_THRESHOLD = 2  # Users with <= this many logs are considered inactive
HOSTEL_BOOST_FACTOR = 0.3  # Probability boost for hostel if user is inactive
PERSONAL_PATTERN_WEIGHT = 0.6  # Weight for personal history vs similar people

# ============================================================================
# FETCH DEPARTMENT AND ROLE FROM PROFILE
# ============================================================================
print("="*80)
print(f"ENHANCED PERSON TIMELINE PREDICTOR - WEEKLY PATTERN")
print("="*80)
print(f"\nLooking up profile for Entity: {TARGET_ENTITY_ID}")

# Check if entity exists in profiles
if TARGET_ENTITY_ID not in df_profiles['entity_id'].values:
    print(f"ERROR: Entity ID '{TARGET_ENTITY_ID}' not found in df_profiles!")
    print(f"Available entity IDs: {sorted(df_profiles['entity_id'].unique())[:10]}...")
    raise ValueError(f"Invalid TARGET_ENTITY_ID: {TARGET_ENTITY_ID}")

# Get target person's profile and extract department/role
target_profile = df_profiles[df_profiles['entity_id'] == TARGET_ENTITY_ID].iloc[0]
TARGET_DEPARTMENT = target_profile['department']
TARGET_ROLE = target_profile['role']

print(f"✓ Profile found!")
print(f"  Entity ID: {TARGET_ENTITY_ID}")
print(f"  Department: {TARGET_DEPARTMENT}")
print(f"  Role: {TARGET_ROLE}")
print(f"  Day of Week: {TARGET_DAY_OF_WEEK}")
print(f"  Training Period: {START_DATE} to {END_DATE}")
print("="*80)

# ============================================================================
# LOCATION NORMALIZATION MAPPING
# ============================================================================
LOCATION_MAPPING = {
    'AUD': 'AUDITORIUM',
    'AUDITORIUM': 'AUDITORIUM',
    'ADMIN': 'ADMIN_LOBBY',
    'ADMIN_LOBBY': 'ADMIN_LOBBY',
    'CAF': 'CAF',
    'CAF_01': 'CAF',
    'LIB_ENT': 'LIBRARY',
    'LIB': 'LIBRARY',
    'LIBRARY': 'LIBRARY',
    'HOSTEL': 'HOSTEL',
    'HOSTEL_GATE': 'HOSTEL',
    'LAB': 'LAB',
    'LAB_101': 'LAB_101',
    'ENG': 'ENG',
    'LAB_305': 'LAB_305',
    'GYM': 'GYM',
    'SEM_01': 'SEMINAR_ROOM',
    'SEMINAR ROOM': 'SEMINAR_ROOM',
    #'ROOM_A2': 'HOSTEL',
    'LAB_102': 'LAB_102',
    #'ROOM_A1': 'HOSTEL'
}

# Text notes to location mapping
TEXT_TO_LOCATION_MAPPING = {
    'Confirmed attendance for robotics workshop.': 'LAB',
    'Wi-Fi not working in hostel block.': 'HOSTEL',
    'CCTV near library needs check.': 'LIBRARY',
    'Broken chair in seminar room.': 'SEMINAR_ROOM',
    'Requesting lab access.': 'LAB_101',
}

def normalize_location(location):
    """Normalize location names to standard equivalents"""
    if pd.isna(location):
        return location
    location_upper = str(location).upper()
    return LOCATION_MAPPING.get(location_upper, location_upper)

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def get_day_of_week(date_str):
    """Convert date string to day of week name"""
    date_obj = datetime.strptime(date_str, '%Y-%m-%d')
    return date_obj.strftime('%A')

def get_all_dates_for_day(start_date, end_date, target_day):
    """Get all dates in range that match the target day of week"""
    dates = []
    current = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    
    while current <= end:
        if current.strftime('%A') == target_day:
            dates.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    
    return dates

def get_all_dates_in_range(start_date, end_date):
    """Get all dates in range"""
    dates = []
    current = datetime.strptime(start_date, '%Y-%m-%d')
    end = datetime.strptime(end_date, '%Y-%m-%d')
    
    while current <= end:
        dates.append(current.strftime('%Y-%m-%d'))
        current += timedelta(days=1)
    
    return dates

# ============================================================================
# LOAD ALL DATASETS
# ============================================================================
# Silently load datasets without printing intermediate steps

# Get all dates
all_dates = get_all_dates_in_range(START_DATE, END_DATE)
target_dates = get_all_dates_for_day(START_DATE, END_DATE, TARGET_DAY_OF_WEEK)

# Filter profiles for similar people (same department and role)
similar_profiles = df_profiles[
    (df_profiles['department'] == TARGET_DEPARTMENT) & 
    (df_profiles['role'] == TARGET_ROLE)
]

# Create mapping dictionaries
card_to_entity = dict(zip(df_profiles['card_id'], df_profiles['entity_id']))
face_to_entity = dict(zip(df_profiles['face_id'], df_profiles['entity_id']))
hash_to_entity = dict(zip(df_profiles['device_hash'], df_profiles['entity_id']))
entity_to_card = dict(zip(df_profiles['entity_id'], df_profiles['card_id']))
entity_to_face = dict(zip(df_profiles['entity_id'], df_profiles['face_id']))
entity_to_hash = dict(zip(df_profiles['entity_id'], df_profiles['device_hash']))

# ============================================================================
# STEP 2: ANALYZE TARGET PERSON'S COMPLETE HISTORY
# ============================================================================
# Silently analyze complete activity history

all_person_data = []

# Prepare all datasets with timestamps
df_card['timestamp'] = pd.to_datetime(df_card['timestamp'])
df_card['date'] = df_card['timestamp'].dt.strftime('%Y-%m-%d')
df_cctv['timestamp'] = pd.to_datetime(df_cctv['timestamp'])
df_cctv['date'] = df_cctv['timestamp'].dt.strftime('%Y-%m-%d')
df_wifi['timestamp'] = pd.to_datetime(df_wifi['timestamp'])
df_wifi['date'] = df_wifi['timestamp'].dt.strftime('%Y-%m-%d')
df_lab['time_start'] = pd.to_datetime(df_lab['start_time'])
df_lab['time_end'] = pd.to_datetime(df_lab['end_time'])
df_lab['date'] = df_lab['time_start'].dt.strftime('%Y-%m-%d')
df_lib['checkout_time'] = pd.to_datetime(df_lib['timestamp'])
df_lib['date'] = df_lib['checkout_time'].dt.strftime('%Y-%m-%d')
df_notes['timestamp'] = pd.to_datetime(df_notes['timestamp'])
df_notes['date'] = df_notes['timestamp'].dt.strftime('%Y-%m-%d')

# Collect ALL data for target person (across all dates in range)
target_card = entity_to_card.get(TARGET_ENTITY_ID)
target_face = entity_to_face.get(TARGET_ENTITY_ID)
target_hash = entity_to_hash.get(TARGET_ENTITY_ID)

# Card swipes (all dates)
if target_card and target_card in df_card['card_id'].values:
    person_swipes = df_card[
        (df_card['card_id'] == target_card) & 
        (df_card['date'].isin(all_dates))
    ]
    for _, row in person_swipes.iterrows():
        all_person_data.append({
            'time': row['timestamp'],
            'date': row['date'],
            'location': normalize_location(row['location_id']),
            'source': 'Card Swipe'
        })

# CCTV (all dates)
if target_face and target_face in df_cctv['face_id'].values:
    person_cctv = df_cctv[
        (df_cctv['face_id'] == target_face) & 
        (df_cctv['date'].isin(all_dates))
    ]
    for _, row in person_cctv.iterrows():
        all_person_data.append({
            'time': row['timestamp'],
            'date': row['date'],
            'location': normalize_location(row['location_id']),
            'source': 'CCTV'
        })

# WiFi (all dates)
if target_hash and target_hash in df_wifi['device_hash'].values:
    person_wifi = df_wifi[
        (df_wifi['device_hash'] == target_hash) & 
        (df_wifi['date'].isin(all_dates))
    ]
    for _, row in person_wifi.iterrows():
        ap_location = row['ap_id'].split('_')[1] if '_' in row['ap_id'] else 'Unknown'
        all_person_data.append({
            'time': row['timestamp'],
            'date': row['date'],
            'location': normalize_location(ap_location),
            'source': 'WiFi'
        })

# Lab (all dates)
person_lab = df_lab[
    (df_lab['entity_id'] == TARGET_ENTITY_ID) & 
    (df_lab['attended_(YES/NO)'].str.upper() == 'YES') &
    (df_lab['date'].isin(all_dates))
]
for _, row in person_lab.iterrows():
    all_person_data.append({
        'time': row['time_start'],
        'date': row['date'],
        'location': 'LAB',
        'source': 'Lab Attendance'
    })

# Library (all dates)
person_lib = df_lib[
    (df_lib['entity_id'] == TARGET_ENTITY_ID) &
    (df_lib['date'].isin(all_dates))
]
for _, row in person_lib.iterrows():
    all_person_data.append({
        'time': row['checkout_time'],
        'date': row['date'],
        'location': 'LIBRARY',
        'source': 'Library'
    })

# Text Notes (all dates)
person_notes = df_notes[
    (df_notes['entity_id'] == TARGET_ENTITY_ID) &
    (df_notes['date'].isin(all_dates))
]
for _, row in person_notes.iterrows():
    # Extract location from text if mapping exists
    text_content = row['text']
    if text_content in TEXT_TO_LOCATION_MAPPING:
        location = TEXT_TO_LOCATION_MAPPING[text_content]
        all_person_data.append({
            'time': row['timestamp'],
            'date': row['date'],
            'location': location,
            'source': 'Text Notes'
        })

all_person_df = pd.DataFrame(all_person_data)
total_person_logs = len(all_person_df)

# Analyze location patterns
if total_person_logs > 0:
    person_locations = set(all_person_df['location'].unique())
else:
    person_locations = set()

# Check if person is low-activity
is_low_activity = total_person_logs <= LOW_ACTIVITY_THRESHOLD

# Filter for target day of week data
target_day_data = all_person_df[all_person_df['date'].isin(target_dates)]

# ============================================================================
# STEP 3: BUILD P1 - SIMILAR PEOPLE PROBABILITY MODEL
# ============================================================================
# Silently build P1 model

similar_entities = set(similar_profiles['entity_id'])
all_similar_data = []

# Collect data from similar people (only on target day of week)
similar_cards = set(similar_profiles['card_id'])
similar_swipes = df_card[
    (df_card['card_id'].isin(similar_cards)) & 
    (df_card['date'].isin(target_dates))
]
for _, row in similar_swipes.iterrows():
    all_similar_data.append({
        'hour': row['timestamp'].hour,
        'minute_slot': row['timestamp'].minute // TIME_INTERVAL_MINUTES,
        'location': normalize_location(row['location_id'])
    })

similar_faces = set(similar_profiles['face_id'])
similar_cctv = df_cctv[
    (df_cctv['face_id'].isin(similar_faces)) & 
    (df_cctv['date'].isin(target_dates))
]
for _, row in similar_cctv.iterrows():
    all_similar_data.append({
        'hour': row['timestamp'].hour,
        'minute_slot': row['timestamp'].minute // TIME_INTERVAL_MINUTES,
        'location': normalize_location(row['location_id'])
    })

similar_hashes = set(similar_profiles['device_hash'])
similar_wifi = df_wifi[
    (df_wifi['device_hash'].isin(similar_hashes)) & 
    (df_wifi['date'].isin(target_dates))
]
for _, row in similar_wifi.iterrows():
    ap_location = row['ap_id'].split('_')[1] if '_' in row['ap_id'] else 'Unknown'
    all_similar_data.append({
        'hour': row['timestamp'].hour,
        'minute_slot': row['timestamp'].minute // TIME_INTERVAL_MINUTES,
        'location': normalize_location(ap_location)
    })

similar_lab = df_lab[
    (df_lab['entity_id'].isin(similar_entities)) & 
    (df_lab['attended_(YES/NO)'].str.upper() == 'YES') &
    (df_lab['date'].isin(target_dates))
]
for _, row in similar_lab.iterrows():
    all_similar_data.append({
        'hour': row['time_start'].hour,
        'minute_slot': row['time_start'].minute // TIME_INTERVAL_MINUTES,
        'location': 'LAB'
    })

similar_lib = df_lib[
    (df_lib['entity_id'].isin(similar_entities)) &
    (df_lib['date'].isin(target_dates))
]
for _, row in similar_lib.iterrows():
    all_similar_data.append({
        'hour': row['checkout_time'].hour,
        'minute_slot': row['checkout_time'].minute // TIME_INTERVAL_MINUTES,
        'location': 'LIBRARY'
    })

# Text notes from similar people
similar_notes = df_notes[
    (df_notes['entity_id'].isin(similar_entities)) &
    (df_notes['date'].isin(target_dates))
]
for _, row in similar_notes.iterrows():
    text_content = row['text']
    if text_content in TEXT_TO_LOCATION_MAPPING:
        location = TEXT_TO_LOCATION_MAPPING[text_content]
        all_similar_data.append({
            'hour': row['timestamp'].hour,
            'minute_slot': row['timestamp'].minute // TIME_INTERVAL_MINUTES,
            'location': location
        })

similar_df = pd.DataFrame(all_similar_data)

# Build P1 probability matrix
similar_df['time_slot'] = similar_df['hour'].astype(str) + '_' + similar_df['minute_slot'].astype(str)
p1_matrix = similar_df.groupby(['time_slot', 'location']).size().reset_index(name='count')
total_counts = similar_df.groupby('time_slot').size().reset_index(name='total')
p1_matrix = p1_matrix.merge(total_counts, on='time_slot')
p1_matrix['p1_probability'] = p1_matrix['count'] / p1_matrix['total']

# ============================================================================
# STEP 4: BUILD P2 - PERSONAL PATTERN MODEL
# ============================================================================
# Silently build P2 model

# Build personal frequency model for target day
personal_data = []
if len(target_day_data) > 0:
    target_day_data['hour'] = target_day_data['time'].dt.hour
    target_day_data['minute_slot'] = target_day_data['time'].dt.minute // TIME_INTERVAL_MINUTES
    
    for _, row in target_day_data.iterrows():
        personal_data.append({
            'hour': row['hour'],
            'minute_slot': row['minute_slot'],
            'location': row['location']
        })

personal_df = pd.DataFrame(personal_data)

if len(personal_df) > 0:
    personal_df['time_slot'] = personal_df['hour'].astype(str) + '_' + personal_df['minute_slot'].astype(str)
    p2_matrix = personal_df.groupby(['time_slot', 'location']).size().reset_index(name='personal_count')
    personal_total = personal_df.groupby('time_slot').size().reset_index(name='personal_total')
    p2_matrix = p2_matrix.merge(personal_total, on='time_slot')
    p2_matrix['p2_probability'] = p2_matrix['personal_count'] / p2_matrix['personal_total']
else:
    p2_matrix = pd.DataFrame(columns=['time_slot', 'location', 'personal_count', 'personal_total', 'p2_probability'])

# ============================================================================
# STEP 5: COMBINE P1 AND P2 WITH CONSTRAINTS
# ============================================================================
# Silently combine models with constraints

# Get all unique locations from similar people
all_locations = set(p1_matrix['location'].unique())

# Get all time slots
all_time_slots = sorted(p1_matrix['time_slot'].unique(), 
                       key=lambda x: (int(x.split('_')[0]), int(x.split('_')[1])))

# Build combined probability matrix
combined_predictions = []

for time_slot in all_time_slots:
    hour, slot = map(int, time_slot.split('_'))
    
    # Get P1 probabilities for this time slot
    p1_data = p1_matrix[p1_matrix['time_slot'] == time_slot].copy()
    
    # Get P2 probabilities if available
    p2_data = p2_matrix[p2_matrix['time_slot'] == time_slot].copy() if len(p2_matrix) > 0 else pd.DataFrame()
    
    # For each location in P1
    for _, p1_row in p1_data.iterrows():
        location = p1_row['location']
        p1_prob = p1_row['p1_probability']
        
        # CONSTRAINT 1: Never visited locations get 0 probability
        if person_locations and location not in person_locations:
            # This person has data but never went to this location
            final_prob = 0.0
            method = "EXCLUDED (Never visited)"
            combined_predictions.append({
                'time_slot': time_slot,
                'hour': hour,
                'minute_slot': slot,
                'location': location,
                'p1_prob': p1_prob,
                'p2_prob': 0.0,
                'final_probability': final_prob,
                'method': method
            })
            continue
        
        # Get P2 probability if exists
        p2_prob = 0.0
        if len(p2_data) > 0:
            p2_match = p2_data[p2_data['location'] == location]
            if len(p2_match) > 0:
                p2_prob = p2_match['p2_probability'].values[0]
        
        # Combine P1 and P2
        if p2_prob > 0:
            # We have personal data - weighted combination
            final_prob = (PERSONAL_PATTERN_WEIGHT * p2_prob + 
                         (1 - PERSONAL_PATTERN_WEIGHT) * p1_prob)
            method = f"P1+P2 (weights: {1-PERSONAL_PATTERN_WEIGHT:.1f}/{PERSONAL_PATTERN_WEIGHT:.1f})"
        else:
            # No personal data - use P1
            final_prob = p1_prob
            method = "P1 only"
        
        # CONSTRAINT 2: Low activity boost for HOSTEL
        if is_low_activity and 'HOSTEL' in location.upper():
            final_prob = min(1.0, final_prob + HOSTEL_BOOST_FACTOR)
            method = f"{method} + HOSTEL BOOST"
        
        combined_predictions.append({
            'time_slot': time_slot,
            'hour': hour,
            'minute_slot': slot,
            'location': location,
            'p1_prob': p1_prob,
            'p2_prob': p2_prob,
            'final_probability': final_prob,
            'method': method
        })

combined_df = pd.DataFrame(combined_predictions)

# Normalize probabilities per time slot
for time_slot in all_time_slots:
    mask = combined_df['time_slot'] == time_slot
    total_prob = combined_df.loc[mask, 'final_probability'].sum()
    if total_prob > 0:
        combined_df.loc[mask, 'final_probability'] = combined_df.loc[mask, 'final_probability'] / total_prob

# ============================================================================
# STEP 6: GENERATE FINAL TIMELINE
# ============================================================================
# Silently generate final timeline

timeline = []

for hour in range(24):
    for slot in range(60 // TIME_INTERVAL_MINUTES):
        time_slot = f"{hour}_{slot}"
        time_str = f"{hour:02d}:{slot*TIME_INTERVAL_MINUTES:02d}"
        
        # Get predictions for this time slot
        slot_predictions = combined_df[combined_df['time_slot'] == time_slot]
        
        if len(slot_predictions) > 0:
            # Get best prediction
            best = slot_predictions.loc[slot_predictions['final_probability'].idxmax()]
            
            # Get top 3 alternatives
            top3 = slot_predictions.nlargest(3, 'final_probability')
            alternatives = ', '.join([
                f"{row['location']}({row['final_probability']:.2%})" 
                for _, row in top3.iterrows()
            ])
            
            timeline.append({
                'time': time_str,
                'location': best['location'],
                'probability': best['final_probability'],
                'p1_prob': best['p1_prob'],
                'p2_prob': best['p2_prob'],
                'method': best['method'],
                'alternatives': alternatives
            })
        else:
            timeline.append({
                'time': time_str,
                'location': 'Unknown',
                'probability': 0.0,
                'p1_prob': 0.0,
                'p2_prob': 0.0,
                'method': 'No Data',
                'alternatives': 'None'
            })

timeline_df = pd.DataFrame(timeline)

# ============================================================================
# DISPLAY RESULTS
# ============================================================================
print("\n" + "="*80)
print(f"FINAL {TARGET_DAY_OF_WEEK.upper()} TIMELINE FOR {TARGET_ENTITY_ID}")
print("="*80)
display(timeline_df[['time', 'location', 'probability']])

print("\n" + "="*80)
print("ANALYSIS SUMMARY")
print("="*80)
print(f"Total activity logs (all dates): {total_person_logs}")
print(f"Activity logs on {TARGET_DAY_OF_WEEK}s: {len(target_day_data)}")
print(f"Low activity user: {is_low_activity}")
print(f"Locations ever visited: {sorted(person_locations) if person_locations else 'None'}")
print(f"\nPrediction breakdown:")
print(timeline_df['method'].value_counts())

# High confidence predictions
high_confidence = timeline_df[timeline_df['probability'] >= 0.5]
print(f"\nHigh confidence predictions (≥50%): {len(high_confidence)} time slots")
if len(high_confidence) > 0:
    display(high_confidence[['time', 'location', 'probability', 'method']])

# Show excluded locations
if person_locations:
    excluded_locations = all_locations - person_locations
    if excluded_locations:
        print(f"\nLocations EXCLUDED (never visited by user): {sorted(excluded_locations)}")


# In[ ]:




