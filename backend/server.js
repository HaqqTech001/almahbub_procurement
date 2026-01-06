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
const orderRoutes = require('./routes/orders');
const trackerRoutes = require('./routes/tracker');
const announcementRoutes = require('./routes/announcements');
const chatRoutes = require('./routes/chat');
const serviceRoutes = require('./routes/services');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const aiRoutes = require('./routes/ai');

const { initializeDatabase } = require('./config/database');
const { authenticateToken } = require('./middleware/auth');
const { setupSocketHandlers } = require('./socket/chat');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// Trust proxy for accurate IP detection behind load balancers/proxies (e.g., Render.com)
app.set('trust proxy', 1);

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

// Rate limiting with proxy trust configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  trustProxy: true, // Trust the X-Forwarded-For header from proxies
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false // Disable `X-RateLimit-*` headers
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

// Email test endpoint that actually sends an email
app.get('/api/test-email-send', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/html');
    res.write('<html><head><title>Email Test</title>');
    res.write('<style>body{font-family:Arial;padding:20px;max-width:800px;margin:0 auto;}');
    res.write('.success{color:green;}.error{color:red;}.info{color:#666;}</style>');
    res.write('</head><body>');
    res.write('<h1>📧 Production Email Test</h1>');
    res.write('<hr>');
    
    // Check environment
    res.write('<h3>Environment Check:</h3>');
    res.write(`<p class="info">GMAIL_USER: ${process.env.GMAIL_USER ? '✓ Set' : '✗ NOT SET'}</p>`);
    res.write(`<p class="info">GMAIL_PASS: ${process.env.GMAIL_PASS ? '✓ Set' : '✗ NOT SET'}</p>`);
    res.write(`<p class="info">CLIENT_URL: ${process.env.CLIENT_URL || '✗ NOT SET'}</p>`);
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
      res.write('<p class="error"><strong>ERROR:</strong> GMAIL_USER and GMAIL_PASS must be set!</p>');
      res.write('<p>To fix: Go to Render Dashboard → Your Service → Environment → Add variables</p>');
      res.write('</body></html>');
      return res.status(500).end();
    }
    
    // Verify connection
    res.write('<h3>Testing SMTP Connection...</h3>');
    await emailService.verifyConnection();
    res.write('<p class="success">✓ Connection verified!</p>');
    
    // Send test email
    res.write('<h3>Sending Test Email...</h3>');
    const result = await emailService.sendEmail(
      process.env.GMAIL_USER,
      '🧪 Production Email Test - Almahbub Procurement',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #205562, #0E5A5C); padding: 40px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Production Email Test Successful!</h1>
          </div>
          <div style="padding: 40px; background: #f5f7f8;">
            <p style="font-size: 16px; color: #333;">
              Your email service is working correctly in production.
            </p>
            <p style="font-size: 14px; color: #666;">
              Sent at: ${new Date().toISOString()}
            </p>
          </div>
        </div>
      `
    );
    res.write(`<p class="success">✓ Email sent! MessageId: ${result.messageId}</p>`);
    
    res.write('<hr>');
    res.write('<p class="success"><strong>✅ All tests passed!</strong></p>');
    res.write('<p>Check your email inbox for the test message.</p>');
    res.write('<p><em>If you don\'t see it, check your spam/junk folder.</em></p>');
    res.write('</body></html>');
    res.end();
  } catch (error) {
    res.write('<h3 class="error">❌ Test Failed!</h3>');
    res.write(`<p class="error"><strong>Error:</strong> ${error.message}</p>`);
    if (error.code) {
      res.write(`<p class="error"><strong>Code:</strong> ${error.code}</p>`);
    }
    res.write('<hr>');
    res.write('<h3>💡 Common Solutions:</h3>');
    res.write('<ol>');
    res.write('<li>Use an App Password, not your regular Gmail password</li>');
    res.write('<li>Enable 2-Step Verification: https://myaccount.google.com/security</li>');
    res.write('<li>Generate App Password: https://myaccount.google.com/apppasswords</li>');
    res.write('<li>Update GMAIL_PASS in Render Environment variables</li>');
    res.write('</ol>');
    res.write('</body></html>');
    res.status(500).end();
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