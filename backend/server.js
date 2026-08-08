// server.js — Express app entry point: middleware, routes, DB connection, and server startup
import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import mongoSanitize from 'express-mongo-sanitize'
import { clerkMiddleware } from '@clerk/express'

import connectDB from './configs/db.js'
import connectCloudinary from './configs/cloudinary.js'
import { dbHealthy } from './configs/db.js'
import { connectRedis, disconnectRedis } from './configs/redis.js'
import Role from './models/Role.js'
import errorHandler from './middleware/errorHandler.js'
import { stripeWebhook } from './controllers/bookingController.js'
import startBookingCleaner from './utils/bookingCleaner.js'
import { API } from './configs/apiContracts.js'

import userRouter from './routes/userRoutes.js'
import hotelRouter from './routes/hotelRoutes.js'
import roomRouter from './routes/roomRoutes.js'
import bookingRouter from './routes/bookingRoutes.js'
import offerRouter from './routes/offerRoutes.js'
import serviceRouter from './routes/serviceRoutes.js'
import recommendationRouter from './routes/recommendationRoutes.js'
import supportRouter from './routes/supportRoutes.js'
import testimonialRouter from './routes/testimonialRoutes.js'
import reviewRouter from './routes/reviewRoutes.js'
import notificationRouter from './routes/notificationRoutes.js'
import placesRouter from './routes/placesRoutes.js'
import itineraryRouter from './routes/itineraryRoutes.js'
import transportRouter from './routes/transportRoutes.js'
import destinationRouter from './routes/destinationRoutes.js'
import pricingRouter from './routes/pricingRoutes.js'
import analyticsRouter from './routes/analyticsRoutes.js'
import checkinRouter from './routes/checkinRoutes.js'
import serviceHistoryRouter from './routes/serviceHistoryRoutes.js'
import pricingMLRouter from './routes/pricingMLRoutes.js'
import invoiceRouter from './routes/invoiceRoutes.js'

import activityRouter from './routes/activityRoutes.js'


import paymentGatewayRouter from './routes/paymentGatewayRoutes.js'
import roomAssignmentRouter from './routes/roomAssignmentRoutes.js'
import guestPricingRouter from './routes/guestPricingRoutes.js'
import mlPricingRouter from './routes/mlPricingRoutes.js'
import guestAssistantRouter from './routes/guestAssistantRoutes.js'
import maintenanceRouter from './routes/maintenanceRoutes.js'
import refundRouter from './routes/refundRoutes.js'
import receptionistRouter from './routes/receptionistRoutes.js'
import roleRouter from './routes/roleRoutes.js'
import adminRouter from './routes/adminRoutes.js'
import orgRouter from './routes/orgRoutes.js'
import authRouter from './routes/authRoutes.js'
import clerkWebhooks from './controllers/clerkWebhooks.js'

const app = express()

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------

app.use(cors())
app.use(helmet())
app.use(rateLimit({ windowMs: 60 * 1000, max: 200 }))

// ---------------------------------------------------------------------------
// Webhooks – must receive raw body before express.json()
// ---------------------------------------------------------------------------

app.post(API.stripeWebhook, express.raw({ type: 'application/json' }), stripeWebhook)

// Clerk webhooks — must receive raw body
app.post('/api/clerk/webhooks', express.raw({ type: 'application/json' }), clerkWebhooks)

// ---------------------------------------------------------------------------
// Body parser
// ---------------------------------------------------------------------------

app.use(express.json())
app.use(clerkMiddleware())

// ---------------------------------------------------------------------------
// NoSQL injection sanitisation (skipped for webhook routes)
// ---------------------------------------------------------------------------

const sanitizeInPlace = (target) => {
  if (target && typeof target === 'object') {
    mongoSanitize.sanitize(target)
  }
}

app.use((req, res, next) => {
  if (req.path === '/api/bookings/stripe-webhook') {
    return next()
  }
  sanitizeInPlace(req.body)
  sanitizeInPlace(req.params)
  sanitizeInPlace(req.query)
  next()
})

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get(API.health, (req, res) => res.send('API is Working'))

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------

app.use('/api/user', userRouter)
app.use('/api/auth', authRouter)
app.use('/api/hotels', hotelRouter)
app.use('/api/rooms', roomRouter)
app.use('/api/bookings', bookingRouter)
app.use('/api/offers', offerRouter)
app.use('/api/services', serviceRouter)
app.use('/api/recommendations', recommendationRouter)
app.use('/api/support', supportRouter)
app.use('/api/testimonials', testimonialRouter)
app.use('/api/reviews', reviewRouter)
app.use('/api/notifications', notificationRouter)
app.use('/api/places', placesRouter)
app.use('/api/itinerary', itineraryRouter)
app.use(['/api/routes', '/api/transport'], transportRouter)
app.use('/api/destinations', destinationRouter)
app.use('/api/pricing', pricingRouter)
app.use('/api/analytics', analyticsRouter)
app.use('/api/checkin', checkinRouter)
app.use('/api/invoice', invoiceRouter)
app.use('/api/services/history', serviceHistoryRouter)

app.use('/api/activities', activityRouter)


app.use('/api/payments', paymentGatewayRouter)
app.use('/api/room-assignment', roomAssignmentRouter)
app.use('/api/guest', guestPricingRouter)
app.use('/api/ml', mlPricingRouter)
app.use('/api/pricing/ml', pricingMLRouter)
app.use('/api/guest-assistant', guestAssistantRouter)
app.use('/api/receptionist', receptionistRouter)
app.use('/api/maintenance', maintenanceRouter)
app.use('/api/refunds', refundRouter)
app.use('/api/roles', roleRouter)
app.use('/api/admin', adminRouter)
app.use('/api/orgs', orgRouter)

// ---------------------------------------------------------------------------
// Error handler (must be last)
// ---------------------------------------------------------------------------

app.use(errorHandler)

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3000

const startServer = async () => {
  try {
    await connectDB()
    connectCloudinary()
    await connectRedis()
    if (dbHealthy) {
      await Role.seedDefaults()
      const cleanupInterval = Number(process.env.BOOKING_HOLD_CLEANUP_INTERVAL_MINUTES) || 1
      startBookingCleaner({ intervalMinutes: cleanupInterval })
    } else {
      console.warn('Database is unavailable; skipping DB seed and booking cleanup startup')
    }
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error('Server startup failed:', error.message)
    process.exit(1)
  }
}

startServer().catch((error) => {
  console.error('Unhandled error in startServer:', error)
  process.exit(1)
})

process.on('SIGINT', async () => {
  await disconnectRedis()
})

process.on('SIGTERM', async () => {
  await disconnectRedis()
})

export default app
