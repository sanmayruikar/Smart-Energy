"""
Feature Engineering for Energy Prediction
Transforms raw telemetry into feature vectors compatible with the trained ML models.
"""

from datetime import datetime
import pandas as pd
import numpy as np

FEATURE_COLUMNS = [
    'hour',
    'day',
    'day_of_week',
    'is_weekend',
    'voltage',
    'current',
    'temperature',
    'lag_power_1h',
    'lag_power_24h',
]

def extract_prediction_features(target_time, recent_readings=None):
    """
    Construct a feature dataframe row for target prediction timestamp.
    """
    hour = target_time.hour
    day = target_time.day
    day_of_week = target_time.weekday()
    is_weekend = 1 if day_of_week >= 5 else 0

    # Default baseline electrical parameters
    voltage = 230.0
    current = 2.0
    temperature = 29.0
    lag_power_1h = 450.0
    lag_power_24h = 420.0

    if recent_readings and len(recent_readings) > 0:
        latest = recent_readings[0]
        voltage = float(latest.get('voltage', 230.0))
        current = float(latest.get('current', 2.0))
        temperature = float(latest.get('temperature', 29.0))
        lag_power_1h = float(latest.get('power', 450.0))

        if len(recent_readings) >= 24:
            lag_power_24h = float(recent_readings[23].get('power', lag_power_1h))
        else:
            lag_power_24h = lag_power_1h * 0.95

    row = {
        'hour': hour,
        'day': day,
        'day_of_week': day_of_week,
        'is_weekend': is_weekend,
        'voltage': voltage,
        'current': current,
        'temperature': temperature,
        'lag_power_1h': lag_power_1h,
        'lag_power_24h': lag_power_24h,
    }

    return pd.DataFrame([row])[FEATURE_COLUMNS]
