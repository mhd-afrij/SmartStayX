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

// Start database connection and server
const startServer = async () => {
  try {
    // Initialize cloudinary (non-blocking)
    connectCloudinary();
    
    // Connect to database and wait for it
    console.log("🔄 Connecting to database...");
    try {
      await connectDB();
      console.log("✅ Database connection established");
    } catch (error) {
      console.error("❌ Database connection failed, but server will continue:", error.message);
      console.log("⚠️  Some features may not work until database is connected");
    }
    
    // Wait for database connection with timeout
    const maxWaitTime = 10000; // 10 seconds
    const startTime = Date.now();
    
    while (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2 && (Date.now() - startTime) < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Only listen in local development (not on Vercel)
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      app.listen(PORT, () => {
        const dbStatus = mongoose.connection.readyState === 1 ? '✅ Connected' : 
                        mongoose.connection.readyState === 2 ? '⏳ Connecting...' : '❌ Disconnected';
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📊 Database connection state: ${dbStatus}`);
      });
    }
  } catch (error) {
    console.error("Error starting server:", error);
  }
};

// Export for Vercel serverless function
export default app;

// Start the server
startServer();
