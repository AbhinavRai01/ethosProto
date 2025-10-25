import pandas as pd
import constants
TEXT_TO_LOCATION_MAPPING = constants.NOTES_MAPPING

LOCATION_MAPPING = constants.LOCATIONS_MAPPING

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




