"""
Dataset Generator for Smart Energy Monitoring System
Generates labeled DEMO / TRAINING DATA for Energy Prediction and Anomaly Detection.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_synthetic_energy_dataset(days=60, output_file=None):
    """
    Generate realistic multi-variable hourly time-series energy consumption data.
    Clearly labeled as DEMO / TRAINING DATA.
    """
    np.random.seed(42)
    start_time = datetime.now() - timedelta(days=days)
    hours = days * 24
    
    timestamps = [start_time + timedelta(hours=i) for i in range(hours)]
    data = []
    
    cumulative_energy = 100.0
    
    for i, ts in enumerate(timestamps):
        hour = ts.hour
        day_of_week = ts.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        
        # Base Diurnal Consumption Model:
        # Deep Night (00:00 - 05:00): 80W - 140W
        # Morning (06:00 - 10:00): 380W - 650W
        # Midday (11:00 - 16:00): 280W - 480W
        # Evening Peak (17:00 - 22:00): 650W - 1100W
        # Late Night (23:00): 180W - 250W
        if 0 <= hour <= 5:
            base_power = 95.0 + np.random.uniform(-15, 25)
        elif 6 <= hour <= 10:
            base_power = 480.0 + np.random.uniform(-40, 70)
        elif 11 <= hour <= 16:
            base_power = 340.0 + np.random.uniform(-30, 50)
        elif 17 <= hour <= 22:
            base_power = 780.0 + np.random.uniform(-60, 110)
        else:
            base_power = 210.0 + np.random.uniform(-20, 30)
            
        if is_weekend:
            base_power *= 1.15  # 15% higher usage on weekends
            
        # Ambient temperature model (colder at night, hotter in afternoon)
        ambient_temp = 27.0 + 7.0 * np.sin((hour - 8) * np.pi / 12) + np.random.uniform(-1.0, 1.0)
        
        # Grid voltage with small ripple
        voltage = 230.0 + np.random.uniform(-4.0, 4.0)
        
        # Inject occasional anomalies (~2% of data)
        is_anomaly = 0
        if np.random.rand() < 0.02:
            is_anomaly = 1
            anomaly_type = np.random.choice(['surge', 'motor_overload', 'thermal_spike'])
            if anomaly_type == 'surge':
                base_power += np.random.uniform(700, 1200)
            elif anomaly_type == 'motor_overload':
                base_power = 1650.0 + np.random.uniform(0, 300)
            elif anomaly_type == 'thermal_spike':
                ambient_temp += np.random.uniform(12.0, 20.0)
                
        current = round(base_power / voltage, 2)
        power = round(voltage * current, 1)
        
        # Target hourly kWh
        hourly_kwh = round(power / 1000.0, 4)
        cumulative_energy += hourly_kwh
        
        data.append({
            'timestamp': ts.strftime('%Y-%m-%d %H:%M:%S'),
            'hour': hour,
            'day': ts.day,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'voltage': round(voltage, 2),
            'current': current,
            'power': power,
            'temperature': round(ambient_temp, 1),
            'energy_kwh': hourly_kwh,
            'cumulative_energy': round(cumulative_energy, 4),
            'is_anomaly': is_anomaly,
            'data_type': 'DEMO/TRAINING DATA'
        })
        
    df = pd.DataFrame(data)
    
    # Lag Features
    df['lag_power_1h'] = df['power'].shift(1).bfill()
    df['lag_power_24h'] = df['power'].shift(24).bfill()
    df['lag_energy_1h'] = df['energy_kwh'].shift(1).bfill()
    
    if output_file:
        df.to_csv(output_file, index=False)
        print(f"[Dataset] Generated {len(df)} synthetic records labeled as DEMO/TRAINING DATA -> {output_file}")
        
    return df

if __name__ == '__main__':
    generate_synthetic_energy_dataset(days=60, output_file='synthetic_energy_dataset.csv')
