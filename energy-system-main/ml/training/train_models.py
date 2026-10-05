"""
Model Training Script for Energy Prediction & Anomaly Detection
Uses Scikit-learn (Random Forest, Gradient Boosting, Isolation Forest).
Calculates authentic evaluation metrics (MAE, RMSE, R²).
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor, IsolationForest
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
try:
    from training.dataset_generator import generate_synthetic_energy_dataset
except ImportError:
    from dataset_generator import generate_synthetic_energy_dataset

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models'))

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

def train_and_evaluate_all():
    os.makedirs(MODELS_DIR, exist_ok=True)
    print("=" * 60)
    print("[ML Training] Starting Smart Energy Models Pipeline")
    print("=" * 60)

    # 1. Generate / Load Training Data
    df = generate_synthetic_energy_dataset(days=60)
    print(f"[ML Training] Dataset Size: {len(df)} records labeled as DEMO/TRAINING DATA")

    # Features and Target
    X = df[FEATURE_COLUMNS]
    y = df['energy_kwh']

    # 80/20 Train-Test Split (Chronological sequence for time-series validity)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)

    print(f"[ML Training] Training samples: {len(X_train)} | Test samples: {len(X_test)}")

    # 2. Train Random Forest Regressor (Primary Horizon Predictor)
    print("[ML Training] Training Random Forest Regressor...")
    rf_model = RandomForestRegressor(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1)
    rf_model.fit(X_train, y_train)

    rf_preds = rf_model.predict(X_test)
    rf_mae = mean_absolute_error(y_test, rf_preds)
    rf_rmse = np.sqrt(mean_squared_error(y_test, rf_preds))
    rf_r2 = r2_score(y_test, rf_preds)

    print(f"[RF Metrics] MAE: {rf_mae:.4f} kWh | RMSE: {rf_rmse:.4f} | R2: {rf_r2:.4f}")

    # 3. Train Gradient Boosting Regressor (Alternative / Ensemble)
    print("[ML Training] Training Gradient Boosting Regressor...")
    gb_model = GradientBoostingRegressor(n_estimators=100, learning_rate=0.08, max_depth=5, random_state=42)
    gb_model.fit(X_train, y_train)

    gb_preds = gb_model.predict(X_test)
    gb_mae = mean_absolute_error(y_test, gb_preds)
    gb_rmse = np.sqrt(mean_squared_error(y_test, gb_preds))
    gb_r2 = r2_score(y_test, gb_preds)

    print(f"[GB Metrics] MAE: {gb_mae:.4f} kWh | RMSE: {gb_rmse:.4f} | R2: {gb_r2:.4f}")

    # Pick best predictor
    best_model = rf_model if rf_r2 >= gb_r2 else gb_model
    best_name = "RandomForestRegressor" if rf_r2 >= gb_r2 else "GradientBoostingRegressor"
    best_metrics = {
        "model": best_name,
        "mae": round(float(rf_mae if best_name == "RandomForestRegressor" else gb_mae), 4),
        "rmse": round(float(rf_rmse if best_name == "RandomForestRegressor" else gb_rmse), 4),
        "r2": round(float(rf_r2 if best_name == "RandomForestRegressor" else gb_r2), 4),
        "features": FEATURE_COLUMNS,
    }

    # 4. Train Isolation Forest for Unsupervised Anomaly Detection
    print("[ML Training] Training Isolation Forest Anomaly Detector...")
    anomaly_features = ['power', 'temperature', 'voltage', 'current']
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.03, # ~3% expected anomalies
        random_state=42
    )
    iso_forest.fit(df[anomaly_features])

    # 5. Save Models and Metadata Artifacts
    rf_path = os.path.join(MODELS_DIR, 'energy_rf_predictor.joblib')
    iso_path = os.path.join(MODELS_DIR, 'anomaly_iso_forest.joblib')
    metrics_path = os.path.join(MODELS_DIR, 'model_metrics.json')

    joblib.dump(best_model, rf_path)
    joblib.dump(iso_forest, iso_path)

    with open(metrics_path, 'w') as f:
        json.dump(best_metrics, f, indent=2)

    print(f"[ML Training] Successfully saved models and metrics to: {MODELS_DIR}")
    return best_metrics

if __name__ == '__main__':
    train_and_evaluate_all()
