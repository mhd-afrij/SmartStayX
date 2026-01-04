import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    
    if (!mongoURI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    // If already connected, return
    if (mongoose.connection.readyState === 1) {
      return;
    }

    // If connecting, wait for it
    if (mongoose.connection.readyState === 2) {
      return new Promise((resolve, reject) => {
        mongoose.connection.once('connected', resolve);
        mongoose.connection.once('error', reject);
      });
    }

    // Connect with options for serverless
    await mongoose.connect(`${mongoURI}/SmartStayX`, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
  } catch (error) {
    console.error('Database connection error:', error.message);
    throw error;
  }
};

export default connectDB;
