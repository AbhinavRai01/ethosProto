import pandas as pd
import json

def CCTVCleaner(input_json):
    if isinstance(input_json, str):
        df = pd.read_json(input_json)
    else:
        df = pd.DataFrame(input_json)
        
    df_cleaned = df.dropna(subset=['face_id'])

    df_cleaned['timestamp'] = pd.to_datetime(df_cleaned['timestamp'])
    df_cleaned['timestamp'] = df_cleaned['timestamp'].dt.strftime('%Y-%m-%d %H:%M:%S')
    
    output_json = df_cleaned.to_json(orient='records', indent=4)
    return output_json
