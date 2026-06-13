// db.js — MongoDB/Mongoose connection setup and event handlers
import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const baseUri = process.env.MONGODB_URI
    if (!baseUri) {
      throw new Error('MONGODB_URI is not set')
    }

    mongoose.connection.on('connected', () => console.log('Database connected'))

    await mongoose.connect(baseUri, {
      dbName: 'SmartStayX',
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 120000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    })
  } catch (error) {
    console.error('Error connecting to the database', error)
    throw error
  }
}

export default connectDB
