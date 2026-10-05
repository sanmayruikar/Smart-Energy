require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { connectDB, getDbStatus } = require('./config/db');
const { initSocket } = require('./socket');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Services
const { seedInitialData } = require('./services/seedService');
const { setAlertIO } = require('./services/alertService');
const { setSimulatorIO, startSimulator } = require('./services/simulatorService');
const { setApplianceIO } = require('./controllers/applianceController');
const { setEsp32IO } = require('./controllers/esp32Controller');

// Routes
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const energyRoutes = require('./routes/energyRoutes');
const applianceRoutes = require('./routes/applianceRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const anomalyRoutes = require('./routes/anomalyRoutes');
const alertRoutes = require('./routes/alertRoutes');
const aiRoutes = require('./routes/aiRoutes');
const esp32Routes = require('./routes/esp32Routes');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '5001', 10);

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Standardized Health Check Endpoints (GET /api/health and GET /health)
const healthHandler = (req, res) => {
  const db = getDbStatus();
  res.json({
    status: 'ok',
    project: 'Smart Energy Monitoring, Prediction & Management System',
    database: db.status.toLowerCase(), // 'connected' or 'disconnected'
    databaseMode: db.mode,
    simulation: true,
    port: PORT,
    timestamp: new Date(),
  });
};

app.get('/api/health', healthHandler);
app.get('/health', healthHandler);

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/energy', energyRoutes);
app.use('/api/appliances', applianceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/esp32', esp32Routes);
app.use('/api/settings', settingsRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Gracefully catch port conflicts without crashing unhandled
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error('\n=======================================================');
    console.error(`❌ PORT IN USE: Port ${PORT} is already occupied.`);
    console.error(`To resolve this:`);
    console.error(`  1. Terminate the process currently listening on port ${PORT}:`);
    console.error(`     netstat -ano | findstr :${PORT}`);
    console.error(`     taskkill /PID <PID> /F`);
    console.error(`  2. Or configure a different port in backend/.env:`);
    console.error(`     PORT=5002`);
    console.error('=======================================================\n');
    process.exit(1);
  } else {
    console.error('Fatal Server Error:', err.message);
    process.exit(1);
  }
});

// Initialize Server, DB, WebSockets, Simulator
const startServer = async () => {
  try {
    // 1. Connect MongoDB (or initialize Demo In-Memory storage)
    await connectDB();

    // 2. Seed Initial Database Collections (idempotent)
    await seedInitialData();

    // 3. Initialize WebSockets
    const io = initSocket(server);
    setAlertIO(io);
    setSimulatorIO(io);
    setApplianceIO(io);
    setEsp32IO(io);

    // 4. Start Energy Telemetry Simulator by default
    await startSimulator();

    // 5. Start HTTP + WS Listener on configured PORT
    server.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`⚡ Smart Energy Monitoring Backend Server Running`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
      console.log(`🔌 WebSockets: Enabled`);
      console.log(`🤖 IoT/Simulator Ingestion: http://localhost:${PORT}/api/esp32/data`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();
