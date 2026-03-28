import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const baseUri = process.env.MONGODB_URI;
    if (!baseUri) {
      throw new Error("MONGODB_URI is not set");
    }

    mongoose.connection.on("connected", () => console.log("Database Connected"));

    await mongoose.connect(baseUri, {
      dbName: "SmartStayX",
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
      retryWrites: true,
    });
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
};

export default connectDB;
