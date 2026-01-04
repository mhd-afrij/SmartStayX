import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import connectDB from './configs/db.js';
import mongoose from 'mongoose';
import { clerkMiddleware } from '@clerk/express';
import clerkWebhooks from './controllers/clerkWebhooks.js';
import userRouter from './routes/userRoutes.js';
import hotelRouter from './routes/hotelRoutes.js';
// Ensure lodash is loaded before Cloudinary to fix lodash/extend module resolution
import _ from 'lodash';
import connectCloudinary from './configs/cloudinary.js';
import roomRouter from './routes/roomRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';

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

// Initialize Cloudinary (safe to call multiple times)
connectCloudinary();

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

app.use(clerkMiddleware()); // Clerk middleware

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
