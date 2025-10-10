import pandas as pd
import re

INPUT_FILE = 'Test_Dataset/student or staff profiles.csv'
OUTPUT_FILE = 'student_or_staff_profiles_cleaned.csv'

df = pd.read_csv(INPUT_FILE)
df_cleaned = df.copy()

def extract_card_number(card_id):
    match = re.search(r'\d+', str(card_id))
    return int(match.group()) if match else 0

card_numbers = df['card_id'].apply(extract_card_number)
max_card_number = card_numbers.max()

duplicated_mask = df_cleaned['card_id'].duplicated(keep='first')
duplicated_indices = df_cleaned[duplicated_mask].index

next_card_number = max_card_number + 1

for idx in duplicated_indices:
    old_card_id = df_cleaned.loc[idx, 'card_id']
    new_card_id = f"C{next_card_number}"
    df_cleaned.loc[idx, 'card_id'] = new_card_id    
    next_card_number += 1

def extract_student_number(student_id):
    match = re.search(r'\d+', str(student_id))
    return int(match.group()) if match else 0

card_numbers = df['student_id'].apply(extract_student_number)
max_card_number = card_numbers.max()

duplicated_mask = df_cleaned['student_id'].duplicated(keep='first')
duplicates_no_null = duplicated_mask & df_cleaned['student_id'].notna()

duplicated_indices = df_cleaned[duplicates_no_null].index

next_card_number = max_card_number + 1

for idx in duplicated_indices:
    old_card_id = df_cleaned.loc[idx, 'student_id']
    new_card_id = f"S{next_card_number}"
    df_cleaned.loc[idx, 'student_id'] = new_card_id    
    next_card_number += 1

def extract_staff_number(staff_id):
    match = re.search(r'\d+', str(staff_id))
    return int(match.group()) if match else 0

card_numbers = df['staff_id'].apply(extract_staff_number)
max_card_number = card_numbers.max()

duplicated_mask = df_cleaned['staff_id'].duplicated(keep='first')
duplicates_no_null = duplicated_mask & df_cleaned['staff_id'].notna()
duplicated_indices = df_cleaned[duplicates_no_null].index

next_card_number = max_card_number + 1

for idx in duplicated_indices:
    old_card_id = df_cleaned.loc[idx, 'staff_id']
    new_card_id = f"T{next_card_number}"
    df_cleaned.loc[idx, 'staff_id'] = new_card_id    
    next_card_number += 1

df_cleaned['entity_id_numeric'] = df_cleaned['entity_id'].str.replace('E', '').astype(int)

mask = df_cleaned['entity_id_numeric'] >= 5000

df_cleaned.loc[mask, 'face_id'] = df_cleaned.loc[mask, 'entity_id'].str.replace('E', 'F', 1)

df_cleaned = df_cleaned.drop(columns=['entity_id_numeric'])

df_cleaned.to_csv(OUTPUT_FILE, index=False)
