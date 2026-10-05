# Hardware Wiring & Pinout Guide

## ESP32 DevKit V1 Pin Assignments

| Component | Pin / Signal | ESP32 GPIO Pin | Function |
| :--- | :--- | :--- | :--- |
| **PZEM-017 RS485** | TX (via MAX485 RO) | GPIO 16 (RX2) | Modbus RTU Data Receive |
| **PZEM-017 RS485** | RX (via MAX485 DI) | GPIO 17 (TX2) | Modbus RTU Data Transmit |
| **DS18B20 Temp** | Data (with 4.7kΩ pullup) | GPIO 4 | 1-Wire Thermal Telemetry |
| **SSD1306 OLED** | SDA | GPIO 21 | I2C Data Line |
| **SSD1306 OLED** | SCL | GPIO 22 | I2C Clock Line |
| **Relay Module IN1**| Relay 1 (LED Light) | GPIO 12 | Active-LOW Load Control |
| **Relay Module IN2**| Relay 2 (Fan) | GPIO 14 | Active-LOW Load Control |
| **Relay Module IN3**| Relay 3 (DC Motor) | GPIO 27 | Active-LOW Load Control |
| **Relay Module IN4**| Relay 4 (Bulb) | GPIO 26 | Active-LOW Load Control |
| **Active Buzzer** | Positive Terminal | GPIO 18 | Overload / Alarm Audio Output |

---

## Power Distribution Architecture

1. **12V DC Primary Supply**:
   - Powers the 12V DC loads (DC Motor, LED Strip, Bulb).
   - Feeds the PZEM-017 DC Voltage measurement terminals (`V+` and `V-`).
   - Ground (`GND`) is common across all modules.

2. **5V DC Logic Supply (Buck Converter / USB)**:
   - Powers the ESP32 DevKit 5V / VIN pin.
   - Powers the 4-Channel Relay Module VCC.
   - Powers the SSD1306 OLED and DS18B20 sensor.

3. **Current Shunt**:
   - Connected in series with the negative (return) line of the 12V loads.
   - Connects to the PZEM-017 shunt input terminals (`I+` and `I-`).

---

## Modbus RTU Communication Settings

- **Baud Rate**: 9600 bps
- **Data Bits**: 8
- **Stop Bits**: 2 (SERIAL_8N2)
- **Parity**: None
- **Default Slave Address**: `0x01`
