import express from "express"
import "dotenv/config"
import cors from "cors"
import connectDB from "./configs/db.js"
import mongoose from "mongoose"
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebhooks.js"
import userRouter from "./routes/userRoutes.js"
import hotelRouter from "./routes/hotelRoutes.js"
import connectCloudinary from "./configs/cloudinary.js"
import roomRouter from "./routes/roomRoutes.js"
import bookingRouter from "./routes/bookingRoutes.js"

const app = express()
app.use(cors())   // Enable Cross-Origin Resource Sharing

// Increase timeout for file uploads (2 minutes)
app.use((req, res, next) => {
  // Set longer timeout for routes that handle file uploads
  if (req.path.includes('/api/rooms') && (req.method === 'POST' || req.method === 'PUT')) {
    req.setTimeout(120000); // 2 minutes for file uploads
    res.setTimeout(120000);
  }
  next();
});

//Middleware
app.use(express.json({ limit: '50mb' })) // Increase body size limit for file uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(clerkMiddleware())

//API to Listen to CLerk webhooks
app.use("/api/clerk",clerkWebhooks);


app.get('/', (req, res) => res.send("API is Working "))
app.use('/api/user',userRouter)
app.use('/api/hotels',hotelRouter)
app.use('/api/rooms',roomRouter)
app.use('/api/bookings',bookingRouter)

const PORT = process.env.PORT || 3000;

// Initialize Cloudinary configuration (just config, no connection overhead)
// Safe to run at module level for both local and serverless
connectCloudinary();

// Lazy database connection helper for serverless environments
// Mongoose connections are cached, so this is safe to call multiple times
// Defined before middleware that uses it
const ensureDBConnection = async () => {
  if (mongoose.connection.readyState === 1) {
    return; // Already connected
  }
  
  try {
    await connectDB();
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    // Don't throw - let routes handle connection errors
  }
};

// Start database connection and server (only for local development)
const startServer = async () => {
  try {
    console.log("🔄 Connecting to database...");
    await ensureDBConnection();
    console.log("✅ Database connection established");
    
    // Wait for database connection with timeout (local dev only)
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Start HTTP server for local development
    app.listen(PORT, () => {
      const dbStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : 
                      mongoose.connection.readyState === 2 ? '⏳ Connecting...' : '❌ Disconnected';
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Database connection state: ${dbStatus}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

// Only start server in local development (NEVER on Vercel)
// On Vercel, connections will be established lazily on first request
// startServer() should NEVER run when imported by serverless handler
// Explicitly check that we're NOT on Vercel before starting server
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
const isLocalDev = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

if (!isVercel && isLocalDev) {
  startServer();
}

// Export for Vercel serverless function
export default app;
