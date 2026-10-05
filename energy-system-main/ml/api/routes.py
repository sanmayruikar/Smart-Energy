"""
FastAPI Routes for ML Prediction and Anomaly Detection Microservice
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

from prediction.predictor import predict_energy_consumption, get_metrics
from anomaly.detector import detect_energy_anomalies
from training.train_models import train_and_evaluate_all

router = APIRouter()

class PredictRequest(BaseModel):
    horizon: str = Field(default="24h", description="Forecast horizon: 1h, 6h, or 24h")
    readings: Optional[List[Dict[str, Any]]] = Field(default=None, description="Recent telemetry readings")

class AnomalyDetectRequest(BaseModel):
    readings: List[Dict[str, Any]] = Field(..., description="List of telemetry readings to evaluate")

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "Smart Energy Machine Learning Microservice",
        "framework": "FastAPI + Scikit-learn",
        "timestamp": datetime.now().isoformat()
    }

@router.get("/metrics")
def get_model_evaluation_metrics():
    """
    Returns verified MAE, RMSE, and R2 performance metrics.
    """
    try:
        metrics = get_metrics()
        return {"success": True, "metrics": metrics}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/predict")
def generate_prediction(req: PredictRequest):
    """
    Generate future energy consumption forecast (1h, 6h, 24h).
    """
    try:
        result = predict_energy_consumption(horizon=req.horizon, recent_readings=req.readings)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/detect-anomalies")
def run_anomaly_detection(req: AnomalyDetectRequest):
    """
    Execute Isolation Forest outlier and anomaly detection.
    """
    try:
        result = detect_energy_anomalies(req.readings)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection error: {str(e)}")

@router.post("/train")
def trigger_retraining():
    """
    Retrain models with fresh data and compute updated validation metrics.
    """
    try:
        new_metrics = train_and_evaluate_all()
        return {
            "success": True,
            "message": "Models successfully trained and updated",
            "metrics": new_metrics
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Training error: {str(e)}")
