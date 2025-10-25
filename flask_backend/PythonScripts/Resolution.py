import pandas as pd

TEXT_TO_LOCATION_MAPPING = {
    'Confirmed attendance for robotics workshop.': 'LAB',
    'Wi-Fi not working in hostel block.': 'HOSTEL',
    'CCTV near library needs check.': 'LIBRARY',
    'Broken chair in seminar room.': 'SEMINAR_ROOM',
    'Requesting lab access.': 'LAB',
}

LOCATION_MAPPING = {
    'AUD': 'AUDITORIUM', 'AUDITORIUM': 'AUDITORIUM', 'AP_AUD_1': 'AUDITORIUM',
    'AP_AUD_2': 'AUDITORIUM', 'AP_AUD_3': 'AUDITORIUM', 'AP_AUD_4': 'AUDITORIUM',
    'AP_AUD_5': 'AUDITORIUM', 'AP_ADMIN_1': 'ADMIN_LOBBY', 'AP_ADMIN_2': 'ADMIN_LOBBY',
    'AP_ADMIN_3': 'ADMIN_LOBBY', 'AP_ADMIN_4': 'ADMIN_LOBBY', 'AP_ADMIN_5': 'ADMIN_LOBBY',
    'ADMIN': 'ADMIN_LOBBY', 'ADMIN_LOBBY': 'ADMIN_LOBBY', 'AP_CAF_1': 'CAF',
    'AP_CAF_2': 'CAF', 'AP_CAF_3': 'CAF', 'AP_CAF_4': 'CAF', 'AP_CAF_5': 'CAF',
    'CAF': 'CAF', 'CAF_01': 'CAF', 'AP_LIB_1': 'LIBRARY', 'AP_LIB_2': 'LIBRARY',
    'AP_LIB_3': 'LIBRARY', 'AP_LIB_4': 'LIBRARY', 'AP_LIB_5': 'LIBRARY',
    'LIB_ENT': 'LIBRARY', 'LIB': 'LIBRARY', 'LIBRARY': 'LIBRARY', 'AP_HOSTEL_1': 'HOSTEL',
    'AP_HOSTEL_2': 'HOSTEL', 'AP_HOSTEL_3': 'HOSTEL', 'AP_HOSTEL_4': 'HOSTEL',
    'AP_HOSTEL_5': 'HOSTEL', 'HOSTEL': 'HOSTEL', 'HOSTEL_GATE': 'HOSTEL',
    'AP_LAB_1': 'LAB', 'AP_LAB_2': 'LAB', 'AP_LAB_3': 'LAB', 'AP_LAB_4': 'LAB',
    'AP_LAB_5': 'LAB', 'LAB': 'LAB', 'LAB_101': 'LAB', 'AP_ENG_1': 'ENG',
    'AP_ENG_2': 'ENG', 'AP_ENG_3': 'ENG', 'AP_ENG_4': 'ENG', 'AP_ENG_5': 'ENG',
    'ENG': 'ENG', 'LAB_305': 'LAB', 'GYM': 'GYM', 'SEM_01': 'SEMINAR_ROOM',
    'SEMINAR ROOM': 'SEMINAR_ROOM', 'LAB_102': 'LAB', 'ROOM_A1': 'SEMINAR_ROOM',
    'ROOM_A2': 'SEMINAR_ROOM',
}

profiles_df = pd.read_csv("datasets/student or staff profiles.csv")
checkouts_df = pd.read_csv("datasets/library_checkouts.csv")
bookings_df = pd.read_csv("datasets/lab_bookings.csv")
notes_df = pd.read_csv("datasets/free_text_notes (helpdesk or RSVPs).csv")
wifi_df = pd.read_csv("datasets/wifi_associations_logs.csv")
cctv_df = pd.read_csv("datasets/cctv_frames.csv")
swipes_df = pd.read_csv("datasets/campus card_swipes.csv")

all_events = []

checkouts_df['timestamp'] = pd.to_datetime(checkouts_df['timestamp'], errors='coerce')
checkouts_df['location_id'] = 'LIBRARY'
checkouts_df['event_source'] = 'LibraryCheckout'
all_events.append(checkouts_df[['entity_id', 'timestamp', 'location_id', 'event_source']])

bookings_df['start_time'] = pd.to_datetime(bookings_df['start_time'], errors='coerce')
bookings_df['end_time'] = pd.to_datetime(bookings_df['end_time'], errors='coerce')
bookings_df['location_id'] = bookings_df['room_id'].map(LOCATION_MAPPING)
bookings_df['event_source'] = 'RoomBooking'
booking_starts = bookings_df[['entity_id', 'start_time', 'location_id', 'event_source']].rename(columns={'start_time': 'timestamp'})
booking_ends = bookings_df[['entity_id', 'end_time', 'location_id', 'event_source']].rename(columns={'end_time': 'timestamp'})
all_events.append(booking_starts)
all_events.append(booking_ends)

notes_df['timestamp'] = pd.to_datetime(notes_df['timestamp'], errors='coerce')
notes_df['location_id'] = notes_df['text'].map(TEXT_TO_LOCATION_MAPPING)
notes_df['location_id'] = notes_df['location_id'].map(LOCATION_MAPPING)
notes_df['event_source'] = 'Note'
all_events.append(notes_df[['entity_id', 'timestamp', 'location_id', 'event_source']])

wifi_df['timestamp'] = pd.to_datetime(wifi_df['timestamp'], errors='coerce')
resolved_wifi = pd.merge(wifi_df, profiles_df[['entity_id', 'device_hash']], on='device_hash', how='left')
resolved_wifi['location_id'] = resolved_wifi['ap_id'].map(LOCATION_MAPPING)
resolved_wifi['event_source'] = 'WiFiLog'
all_events.append(resolved_wifi[['entity_id', 'timestamp', 'location_id', 'event_source']])

cctv_df['timestamp'] = pd.to_datetime(cctv_df['timestamp'], errors='coerce')
resolved_cctv = pd.merge(cctv_df, profiles_df[['entity_id', 'face_id']], on='face_id', how='left')
resolved_cctv['location_id'] = resolved_cctv['location_id'].map(LOCATION_MAPPING)
resolved_cctv['event_source'] = 'CCTV'
all_events.append(resolved_cctv[['entity_id', 'timestamp', 'location_id', 'event_source']])

swipes_df['timestamp'] = pd.to_datetime(swipes_df['timestamp'], errors='coerce')
resolved_swipes = pd.merge(swipes_df, profiles_df[['entity_id', 'card_id']], on='card_id', how='left')
resolved_swipes['location_id'] = resolved_swipes['location_id'].map(LOCATION_MAPPING)
resolved_swipes['event_source'] = 'CardSwipe'
all_events.append(resolved_swipes[['entity_id', 'timestamp', 'location_id', 'event_source']])

final_timeline = pd.concat(all_events, ignore_index=True)
final_timeline.dropna(subset=['entity_id', 'timestamp', 'location_id'], inplace=True)
final_timeline = final_timeline.sort_values(by=['entity_id', 'timestamp']).reset_index(drop=True)




