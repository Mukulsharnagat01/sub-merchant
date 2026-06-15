require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const merchantRoutes = require('./routes/merchantRoutes');
const kycRoutes = require('./routes/kycRoutes');

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware - allow common dev ports (5173, 5174) and frontend origins from env
// Support a single FRONTEND_URL or comma-separated FRONTEND_URLS for multiple domains
const envFrontend = process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '';
const envOrigins = envFrontend.split(',').map(s => s.trim()).filter(Boolean);
const allowedOrigins = [
  ...envOrigins,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174'
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (e.g., mobile apps, curl)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error('CORS policy: Origin not allowed'), false);
  },
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 200
}));

// Body parser - raw for webhooks, json for everything else
app.use('/api/kyc/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// API Routes (multer applied per-route in kycRoutes for document upload)
app.use('/api/auth', authRoutes);
app.use('/api/merchant', merchantRoutes);
app.use('/api/kyc', kycRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Razorpay KYC API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route for platform / browser checks
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Razorpay KYC Backend Running Successfully'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const portNumber = Number(PORT);
const bind = Number.isNaN(portNumber) ? `Pipe ${PORT}` : `Port ${portNumber}`;

const server = app.listen(portNumber, () => {
  console.log(`
  ╔════════════════════════════════════════════════╗
  ║                                                ║
  ║   🚀 Razorpay KYC Server Running!              ║
  ║                                                ║
  ║   Port: ${portNumber}                                   ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}                  ║
  ║                                                ║
  ║   Endpoints:                                   ║
  ║   • Auth:     /api/auth                        ║
  ║   • Merchant: /api/merchant                    ║
  ║   • KYC:      /api/kyc                         ║
  ║                                                ║
  ╚════════════════════════════════════════════════╝
  `);
});

server.on('error', (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  if (error.code === 'EADDRINUSE') {
    console.error(`❌ ${bind} is already in use. Please stop the process using this port or set a different PORT in .env.`);
    process.exit(1);
  }

  throw error;
});

// Graceful shutdown - release port when nodemon/process restarts
const shutdown = () => {
  server.close(() => {
    process.exit(0);
  });
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err.message);
  process.exit(1);
});