import pandas as pd
import os

DATA_READY = False
all_events_df = None
group_counts = None

def load_all_data():
    global DATA_READY, all_events_df, group_counts
    try:
        df_card = pd.read_csv('datasets/campus card_swipes.csv')
        df_wifi = pd.read_csv('datasets/wifi_associations_logs.csv')
        df_cctv = pd.read_csv('datasets/cctv_frames.csv')
        df_profiles = pd.read_csv('datasets/student or staff profiles.csv')
        df_lab = pd.read_csv("datasets/lab_bookings.csv")
        df_lib = pd.read_csv("datasets/library_checkouts.csv")
        df_notes = pd.read_csv("datasets/free_text_notes (helpdesk or RSVPs).csv")

        swipes_df_std = df_card[['card_id', 'location_id', 'timestamp']].copy()
        swipes_df_std = swipes_df_std.merge(df_profiles[['card_id', 'entity_id']], on='card_id', how='inner')
        
        wifi_df_std = df_wifi[['device_hash', 'ap_id', 'timestamp']].copy()
        wifi_df_std.rename(columns={'ap_id': 'location_id'}, inplace=True)
        wifi_df_std = wifi_df_std.merge(df_profiles[['device_hash', 'entity_id']], on='device_hash', how='inner')

        cctv_df_std = df_cctv[['face_id', 'location_id', 'timestamp']].copy()
        cctv_df_std = cctv_df_std.merge(df_profiles[['face_id', 'entity_id']], on='face_id', how='inner')

        lab_df_std = pd.DataFrame()
        if 'attended_(YES/NO)' in df_lab.columns:
            lab_df_std = df_lab[df_lab['attended_(YES/NO)'].str.upper() == 'YES'][['entity_id', 'room_id', 'start_time']].copy()
            lab_df_std.rename(columns={'room_id': 'location_id', 'start_time': 'timestamp'}, inplace=True)

        lib_df_std = df_lib[['entity_id', 'timestamp']].copy()
        lib_df_std['location_id'] = 'LIBRARY'
        
        TEXT_TO_LOCATION_MAPPING = {
            'Confirmed attendance for robotics workshop.': 'LAB', 'Wi-Fi not working in hostel block.': 'HOSTEL',
            'CCTV near library needs check.': 'LIBRARY', 'Broken chair in seminar room.': 'SEMINAR_ROOM',
            'Requesting lab access.': 'LAB',
        }
        notes_df_std = pd.DataFrame()
        if 'text' in df_notes.columns:
            notes_df_std = df_notes[['entity_id', 'text', 'timestamp']].copy()
            notes_df_std['location_id'] = notes_df_std['text'].map(TEXT_TO_LOCATION_MAPPING)
        
        all_events_df = pd.concat([
            swipes_df_std[['entity_id', 'location_id', 'timestamp']], wifi_df_std[['entity_id', 'location_id', 'timestamp']],
            cctv_df_std[['entity_id', 'location_id', 'timestamp']], lab_df_std[['entity_id', 'location_id', 'timestamp']],
            lib_df_std[['entity_id', 'location_id', 'timestamp']], notes_df_std[['entity_id', 'location_id', 'timestamp']]
        ], ignore_index=True)
        
        LOCATION_MAPPING = {
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
        all_events_df['location_id'] = all_events_df['location_id'].map(LOCATION_MAPPING).fillna(all_events_df['location_id'])
        
        all_events_df['timestamp'] = pd.to_datetime(all_events_df['timestamp'], format='mixed')
        all_events_df['day_of_week'] = all_events_df['timestamp'].dt.day_name()
        all_events_df['hour'] = all_events_df['timestamp'].dt.hour
        
        all_events_df = all_events_df.merge(df_profiles[['entity_id', 'role', 'department']], on='entity_id', how='left')
        all_events_df.dropna(subset=['location_id', 'entity_id', 'role', 'department'], inplace=True)
        
        group_counts = df_profiles.groupby(['role', 'department']).size().reset_index(name='group_size')
        DATA_READY = True
        print("--- Data pre-processing complete. Ready for requests. ---")

    except FileNotFoundError as e:
        DATA_READY = False
        print(f"--- FATAL ERROR: Could not load data files. Details: {e} ---")

def calculate_predicted_density(day_of_week, time_window_hours=1):
    if not DATA_READY:
        return {"error": "Server data is not loaded correctly. Check server logs."}

    valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    if day_of_week not in valid_days:
        return {"error": f"Invalid day of the week. Please choose from: {', '.join(valid_days)}"}

    day_specific_df = all_events_df[all_events_df['day_of_week'] == day_of_week]
    if day_specific_df.empty:
        return {}
        
    group_events = day_specific_df.groupby(['role', 'department', 'hour', 'location_id']).size().reset_index(name='event_count')
    total_group_events_per_hour = day_specific_df.groupby(['role', 'department', 'hour']).size().reset_index(name='total_events')
    
    prob_df = group_events.merge(total_group_events_per_hour, on=['role', 'department', 'hour'])
    prob_df = prob_df[prob_df['total_events'] > 0]
    prob_df['probability'] = prob_df['event_count'] / prob_df['total_events']
    
    density_data = []
    
    for hour in range(24):
        hourly_probs = prob_df[prob_df['hour'] == hour]
        
        if hourly_probs.empty:
            continue
            
        hourly_density = hourly_probs.merge(group_counts, on=['role', 'department'])
        hourly_density['expected_users'] = hourly_density['probability'] * hourly_density['group_size']
        
        location_density_per_hour = hourly_density.groupby('location_id')['expected_users'].sum().round().astype(int)
        
        for location, count in location_density_per_hour.items():
            density_data.append({
                'hour': hour,
                'location_id': location,
                'user_count': count
            })

    output = {}
    for item in density_data:
        location = item['location_id']
        start_hour = item['hour']
        count = item['user_count']
        
        if location not in output:
            output[location] = []
            
        end_hour = (start_hour + time_window_hours) % 24
        time_range = f"{start_hour:02d}:00 - {end_hour:02d}:00"
        
        output[location].append({
            "time_window": time_range,
            "user_count": count
        })
        
    for location in output:
        output[location] = sorted(output[location], key=lambda x: x['time_window'])
        
    return output

