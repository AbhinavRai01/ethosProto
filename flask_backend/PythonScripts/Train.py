# Save as PythonScripts/training_service.py
import pandas as pd
import xgboost as xgb
from sklearn.preprocessing import LabelEncoder
import numpy as np
import os
import pickle

def TrainModel():
    """
    Loads all data, engineers features, trains the model, and saves all
    necessary assets to a single file for the prediction service.
    """
    print("--- Starting model training process... ---")
    
    # --- 1. Load and Process Data ---
    script_dir = os.path.dirname(os.path.abspath(__file__))
    parent_dir = os.path.dirname(script_dir)
    
    timeline_path = os.path.join(parent_dir, 'FinalTimeline.pkl')
    profiles_path = os.path.join(parent_dir, 'datasets', 'student or staff profiles.csv')
    
    df = pd.read_pickle(timeline_path)
    profiles_df = pd.read_csv(profiles_path)

    # --- 2. Feature Engineering ---
    df = pd.merge(df, profiles_df[['entity_id', 'department']], on='entity_id', how='left')
    df['next_location'] = df.groupby('entity_id')['location_id'].shift(-1)
    df.rename(columns={'location_id': 'last_location'}, inplace=True)
    df['last_location_2'] = df.groupby('entity_id')['last_location'].shift(1)
    df['last_location_3'] = df.groupby('entity_id')['last_location'].shift(2)
    df['last_location_2'] = df['last_location_2'].fillna('None')
    df['last_location_3'] = df['last_location_3'].fillna('None')
    df['hour'] = df['timestamp'].dt.hour
    df['dayofweek'] = df['timestamp'].dt.dayofweek
    df.dropna(subset=['next_location'], inplace=True)

    # --- 3. Encode and Train ---
    le_location = LabelEncoder()
    df['next_location_encoded'] = le_location.fit_transform(df['next_location'])
    target = 'next_location_encoded'
    
    features_to_encode = ['department', 'last_location', 'last_location_2', 'last_location_3']
    numerical_features = ['hour', 'dayofweek']
    X_categorical = pd.get_dummies(df[features_to_encode], prefix=features_to_encode)
    X_numerical = df[numerical_features]
    X = pd.concat([X_numerical, X_categorical], axis=1)
    y = df[target]

    # Train on the FULL dataset for production
    model = xgb.XGBClassifier(objective='multi:softprob', eval_metric='mlogloss')
    model.fit(X, y)
    print("Model training complete.")

    # --- 4. Save Assets ---
    model_assets = {
        'model': model,
        'encoder': le_location,
        'columns': X.columns,
        'history_df': df
    }
    
    assets_path = os.path.join(script_dir, 'model_assets.pkl')
    with open(assets_path, 'wb') as f:
        pickle.dump(model_assets, f)
        
    print(f"Model assets saved successfully to {assets_path}")

# This allows you to run the script directly from the command line
if __name__ == '__main__':
    TrainModel()