import express from "express"
import "dotenv/config"
import cors from "cors"
import connectDB from "./configs/db.js"
import { clerkMiddleware } from '@clerk/express'
import clerkWebhooks from "./controllers/clerkWebhooks.js"
import userRouter from "./routes/userRoutes.js"
import hotelRouter from "./routes/hotelRoutes.js"
import connectCloudinary from "./configs/cloudinary.js"
import roomRouter from "./routes/roomRoutes.js"
import bookingRouter from "./routes/bookingRoutes.js"
import offerRouter from "./routes/offerRoutes.js"
import serviceRouter from "./routes/serviceRoutes.js"
import { stripeWebhook } from "./controllers/bookingController.js"

connectDB()
connectCloudinary();

const app = express()
app.use(cors())   // Enable Cross-Origin Resource Sharing

// Stripe webhook must receive raw body for signature verification.
app.post('/api/bookings/stripe-webhook', express.raw({ type: 'application/json' }), stripeWebhook)

//Middleware
app.use(express.json())
app.use(clerkMiddleware())

//API to Listen to CLerk webhooks
app.use("/api/clerk",clerkWebhooks);


app.get('/', (req, res) => res.send("API is Working "))
app.use('/api/user',userRouter)
app.use('/api/hotels',hotelRouter)
app.use('/api/rooms',roomRouter)
app.use('/api/bookings',bookingRouter)
app.use('/api/offers',offerRouter)
app.use('/api/services',serviceRouter)

const PORT = process.env.PORT || 3000;

if (!process.env.VERCEL) {
	app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
