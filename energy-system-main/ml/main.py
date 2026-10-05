"""
Smart Energy ML Microservice Entry Point
FastAPI + Scikit-Learn (Random Forest & Isolation Forest)
"""

import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from api.routes import router

app = FastAPI(
    title="Smart Energy ML & AI Service",
    description="Microservice for energy forecasting (Random Forest) and anomaly detection (Isolation Forest)",
    version="1.0.0"
)

# Enable CORS for React dashboard and Express backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def root():
    return {
        "project": "Smart Energy Monitoring, Prediction & Management System",
        "module": "Machine Learning Service",
        "endpoints": [
            "/health",
            "/metrics",
            "/predict",
            "/detect-anomalies",
            "/train"
        ]
    }

if __name__ == "__main__":
    print("[ML Service] Starting FastAPI Microservice on http://127.0.0.1:8000...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
