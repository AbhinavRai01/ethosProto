import pandas as pd

INPUT_FILE = 'Test_Dataset/cctv_frames.csv'
OUTPUT_FILE = 'cctv_frames_cleaned.csv'

df = pd.read_csv(INPUT_FILE)

df_cleaned = df.dropna(subset=['face_id'])

df_cleaned.to_csv(OUTPUT_FILE, index=False)
