"""
Isolation Forest Anomaly Detector
Detects sudden power spikes, unusual thermal footprints, and abnormal load conditions.
"""

import os
import joblib
import numpy as np
import pandas as pd
from datetime import datetime

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'models'))
MODEL_FILE = os.path.join(MODELS_DIR, 'anomaly_iso_forest.joblib')

_cached_detector = None

def get_detector():
    global _cached_detector
    if _cached_detector is None:
        if os.path.exists(MODEL_FILE):
            _cached_detector = joblib.load(MODEL_FILE)
        else:
            raise FileNotFoundError(f"Anomaly detector file not found at {MODEL_FILE}")
    return _cached_detector

def detect_energy_anomalies(readings_list):
    """
    Evaluate list of readings for multi-variable anomalies.
    Returns categorized anomalies with severity, expected range, and domain explanations.
    """
    if not readings_list:
        return {"success": True, "anomalies": []}

    detector = get_detector()
    anomalies = []

    # Prepare DataFrame
    rows = []
    for r in readings_list:
        rows.append({
            'power': float(r.get('power', 0.0)),
            'temperature': float(r.get('temperature', 28.0)),
            'voltage': float(r.get('voltage', 230.0)),
            'current': float(r.get('current', 0.0)),
            'raw': r,
        })

    df = pd.DataFrame(rows)
    features = ['power', 'temperature', 'voltage', 'current']

    # Isolation Forest: -1 for anomaly, 1 for inlier
    scores = detector.decision_function(df[features])
    preds = detector.predict(df[features])

    for i, pred in enumerate(preds):
        raw = rows[i]['raw']
        power = rows[i]['power']
        temp = rows[i]['temperature']
        voltage = rows[i]['voltage']
        score = scores[i]

        # Check model flag or domain rule thresholds
        is_outlier = (pred == -1) or (power > 1400) or (temp > 45) or (voltage < 200 or voltage > 250)

        if is_outlier:
            # Determine severity
            if power > 1650 or temp > 52:
                severity = 'CRITICAL'
            elif power > 1300 or temp > 47:
                severity = 'HIGH'
            elif power > 900 or temp > 43:
                severity = 'MEDIUM'
            else:
                severity = 'LOW'

            # Determine primary fault attribute and diagnostic rationale
            if power > 1300:
                metric = 'power'
                appliance = 'DC Water Motor / High Inductive Load'
                expected_min = 100
                expected_max = 800
                explanation = f"Sudden power surge detected ({power}W). Exceeds regular operational threshold. Possible rotor stall, mechanical friction, or short-circuit."
            elif temp > 45:
                metric = 'temperature'
                appliance = 'Control Enclosure'
                expected_min = 25
                expected_max = 42
                explanation = f"Abnormal thermal buildup ({temp}°C) relative to power demand. Check ventilation fan and heat sink."
            else:
                metric = 'voltage'
                appliance = 'Main Supply Line'
                expected_min = 215
                expected_max = 245
                explanation = f"Voltage fluctuation ({voltage}V). Out-of-spec grid deviation may degrade connected motors and electronics."

            anomalies.append({
                "timestamp": raw.get('timestamp', datetime.now().isoformat()),
                "deviceId": raw.get('deviceId', 'ESP32-PZEM-01'),
                "appliance": appliance,
                "power": power,
                "expectedRange": { "min": expected_min, "max": expected_max },
                "actualValue": power if metric == 'power' else (temp if metric == 'temperature' else voltage),
                "severity": severity,
                "metric": metric,
                "anomalyScore": round(float(score), 3),
                "explanation": explanation,
                "isResolved": False,
            })

    return {
        "success": True,
        "totalEvaluated": len(readings_list),
        "anomaliesCount": len(anomalies),
        "status": "Anomaly Detected" if len(anomalies) > 0 else "Normal",
        "anomalies": anomalies,
    }
