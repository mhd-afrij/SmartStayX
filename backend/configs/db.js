// db.js — MongoDB/Mongoose connection setup and event handlers
import mongoose from 'mongoose'

// Connects to MongoDB via Mongoose with sensible timeouts and pool settings
let dbHealthy = false

const connectDB = async () => {
  try {
    const baseUri = process.env.MONGODB_URI
    if (!baseUri) {
      throw new Error('MONGODB_URI is not set')
    }

    mongoose.connection.on('connected', () => {
      dbHealthy = true
      console.log('Database connected')
    })

    await mongoose.connect(baseUri, {
      dbName: 'SmartStayX',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    })

    dbHealthy = true
  } catch (error) {
    dbHealthy = false
    console.error('Error connecting to the database', error)

    // In dev we can still start the API so the frontend loads.
    // DB-backed endpoints should return 503 when dbHealthy=false.
    if (process.env.NODE_ENV === 'development') {
      return { ok: false, error: error.message }
    }

    throw error
  }
}

export { dbHealthy }
export default connectDB

