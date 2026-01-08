import express from 'express';
import 'dotenv/config';
import cors from 'cors';
// Import lodash before Cloudinary to ensure it's available for Cloudinary's internal requires
// Cloudinary uses require('lodash/extend') which needs lodash to be loaded first
import _ from 'lodash';
import connectDB from './configs/db.js';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import clerkWebhooks from './controllers/clerkWebhooks.js';
import userRouter from './routes/userRoutes.js';
import hotelRouter from './routes/hotelRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import roomRouter from './routes/roomRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';

// Validate critical environment variables (non-blocking for optional services)
const validateEnvVars = () => {
  const required = ['MONGODB_URI'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn('⚠️  Missing required environment variables:', missing.join(', '));
    console.warn('⚠️  Some features may not work correctly');
  }
  
  // Log optional but recommended env vars
  const optional = ['CLERK_SECRET_KEY', 'CLOUDINARY_CLOUD_NAME', 'SMTP_USER'];
  const missingOptional = optional.filter(key => !process.env[key]);
  if (missingOptional.length > 0 && process.env.NODE_ENV === 'production') {
    console.warn('⚠️  Missing optional environment variables:', missingOptional.join(', '));
  }
};

// Run validation
validateEnvVars();

const app = express();
app.use(cors()); // Enable Cross-Origin Resource Sharing

// Increase timeout for file uploads (2 minutes)
app.use((req, res, next) => {
  // Set longer timeout for routes that handle file uploads
  if (req.path.includes('/api/rooms') && (req.method === 'POST' || req.method === 'PUT')) {
    req.setTimeout(120000); // 2 minutes for file uploads
    res.setTimeout(120000);
  }
  next();
});

// Middleware
app.use(express.json({ limit: '50mb' })); // Increase body size limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Cloudinary (safe to call multiple times) - wrap in try-catch for safety
try {
  connectCloudinary();
} catch (error) {
  console.error('Cloudinary initialization error:', error.message);
  // Continue without Cloudinary - file upload routes will handle errors
}

// Database connection middleware - ensures DB is connected before handling requests
let dbConnectionPromise = null;
const ensureDatabaseConnection = async (req, res, next) => {
  try {
    // If already connected, proceed
    if (mongoose.connection.readyState === 1) {
      return next();
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
      if (!dbConnectionPromise) {
        dbConnectionPromise = connectDB();
      }
      await dbConnectionPromise;
      return next();
    }

    // If disconnected, connect
    if (mongoose.connection.readyState === 0) {
      if (!dbConnectionPromise) {
        dbConnectionPromise = connectDB();
      }
      await dbConnectionPromise;
      return next();
    }

    next();
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(503).json({
      success: false,
      message: 'Database connection failed. Please try again later.'
    });
  }
};

// Apply database connection middleware to all routes except health check
app.use((req, res, next) => {
  if (req.path === '/' || req.path === '/health') {
    return next();
  }
  return ensureDatabaseConnection(req, res, next);
});

// Clerk middleware - wrap in try-catch to prevent crashes
// Only initialize if CLERK_SECRET_KEY is available
if (process.env.CLERK_SECRET_KEY) {
  try {
    app.use(clerkMiddleware());
    console.log('✅ Clerk middleware initialized');
  } catch (error) {
    console.error('❌ Clerk middleware initialization error:', error.message);
    // Continue without Clerk middleware - protected routes will handle auth errors
  }
} else {
  console.warn('⚠️  CLERK_SECRET_KEY not set - Clerk middleware disabled');
}

// API to Listen to Clerk webhooks
app.use('/api/clerk', clerkWebhooks);

app.get('/', (req, res) => res.send('API is Working '));
app.get('/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', database: dbStatus });
});

app.use('/api/user', userRouter);
app.use('/api/hotels', hotelRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/bookings', bookingRouter);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler middleware - MUST be last
// This catches all unhandled errors and prevents FUNCTION_INVOCATION_FAILED
app.use((err, req, res, next) => {
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Don't send error details in production for security
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // In production, you might want to exit gracefully
  // process.exit(1);
});

const PORT = process.env.PORT || 3000;

// Database connection for local development
const connectToDatabase = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await connectDB();
      console.log('✅ Database connection established');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
};

// Start server only for local development
const startServer = async () => {
  try {
    // Connect to the database
    console.log('🔄 Connecting to database...');
    await connectToDatabase();

    app.listen(PORT, () => {
      const dbStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected';
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database connection state: ${dbStatus}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

// Export for Vercel Serverless Function (App handler)
export default app;

// Only start the server locally (not on Vercel)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  startServer();
}
