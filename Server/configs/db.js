import mongoose from "mongoose";

const connectDB = async () => {
  try {
    mongoose.connection.on('connected',()=>console.log("Database Connected"));
    await mongoose.connect(`${process.env.MONGODB_URI}/SmartStayX`);
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Error connecting to the database", error);
  }
};

export default connectDB;
