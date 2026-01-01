import mongoose from "mongoose";

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;
  await mongoose.connect(`${mongoURI}/SmartStayX`);
};

export default connectDB;
