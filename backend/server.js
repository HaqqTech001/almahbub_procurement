const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const requestRoutes = require('./routes/requests');
const trackerRoutes = require('./routes/tracker');
const announcementRoutes = require('./routes/announcements');
const chatRoutes = require('./routes/chat');
const serviceRoutes = require('./routes/services');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');
const orderRoutes = require('./routes/orders')

const { initializeDatabase } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');
const { setupSocketHandlers } = require('./socket/chat');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS configuration
const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      // Allow all origins for Socket.IO
      return callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration - Allow all origins for development
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Handle OPTIONS preflight requests
app.options('*', cors());

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static file serving for uploads
const path = require('path');
const emailService = require('./services/emailService');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Email test endpoint (for debugging email issues)
app.get('/api/test-email', async (req, res) => {
  try {
    await emailService.verifyConnection();
    res.json({
      success: true,
      message: 'Email server connection verified successfully',
      configured: !!process.env.GMAIL_USER
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Email server connection failed',
      error: error.message,
      help: 'Make sure GMAIL_USER and GMAIL_PASS environment variables are set. For Gmail, you need an App Password, not your regular password. Enable 2-Step Verification and generate an App Password from your Google Account.'
    });
  }
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/tracker', trackerRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/users', authenticateToken, userRoutes);
app.use('/api/v1/ai', aiRoutes);

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    server.listen(PORT, () => {
      console.log(`🚀 Almahbub Procurement Platform Backend`);
      console.log(`📡 Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📡 Socket.IO enabled for real-time chat`);
      console.log(`🔗 Admin Dashboard: http://localhost:5174`);
      console.log(`👤 Client Frontend: http://localhost:5173`);
      console.log('');
      console.log('🔑 Admin Credentials:');
      console.log('   Email: admin@almahbub.com');
      console.log('   Password: admin123456');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = { app, server, io };