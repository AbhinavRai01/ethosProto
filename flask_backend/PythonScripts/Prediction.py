import pandas as pd
import numpy as np
import os
import pickle

# --- Load the pre-trained assets ONCE when the module is imported ---
script_dir = os.path.dirname(os.path.abspath(__file__))
assets_path = os.path.join(script_dir, 'model_assets.pkl')

with open(assets_path, 'rb') as f:
    MODEL_ASSETS = pickle.load(f)

# Unpack the assets into global variables for the function to use
MODEL = MODEL_ASSETS['model']
ENCODER = MODEL_ASSETS['encoder']
COLUMNS = MODEL_ASSETS['columns']
HISTORY_DF = MODEL_ASSETS['history_df']

def predict_daily_schedule(entity_id, day_of_week):
    """
    Predicts a 24-hour schedule using the pre-trained global model and assets.
    """
    # Find the last known state of the user from the historical data
    entity_info = HISTORY_DF[HISTORY_DF['entity_id'] == entity_id].iloc[-1]
    department = entity_info['department']
    last_loc_3 = entity_info['last_location_2']
    last_loc_2 = entity_info['last_location']
    last_loc_1 = entity_info['next_location']
    
    daily_predictions = []

    for hour in range(24):
        current_features = pd.DataFrame([{
            'hour': hour, 'dayofweek': day_of_week%7, 'department': department,
            'last_location': last_loc_1, 'last_location_2': last_loc_2, 'last_location_3': last_loc_3
        }])
        
        current_features_encoded = pd.get_dummies(current_features)
        current_features_aligned = current_features_encoded.reindex(columns=COLUMNS, fill_value=0)
        
        prediction_probabilities = MODEL.predict_proba(current_features_aligned)[0]
        confidence_score = np.max(prediction_probabilities)
        prediction_encoded = np.argmax(prediction_probabilities)
        predicted_location = ENCODER.inverse_transform([prediction_encoded])[0]
        
        daily_predictions.append({
            'Hour': f"{hour:02d}:00",
            'Predicted Location': predicted_location,
            'Confidence': f"{confidence_score:.2%}"
        })
        
        # Update the history for the next iteration
        last_loc_3 = last_loc_2
        last_loc_2 = last_loc_1
        last_loc_1 = predicted_location
        
    DailyTimeline = pd.DataFrame(daily_predictions)
    json_data = DailyTimeline.to_json(orient='records')
    return json_data