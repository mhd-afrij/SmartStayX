import mongoose from "mongoose";

const destinationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Destination city/area name
    image: { type: String, default: "" }, // URL to destination photo
    description: { type: String, default: "" }, // Brief description of the destination
    hotelCount: { type: String, default: "0 hotels" }, // Display string for number of hotels
    temperature: { type: String, default: "" }, // Current or average temperature display
    country: { type: String, default: "" }, // Country the destination is in
    featured: { type: Boolean, default: false }, // Whether featured on landing page
  },
  { timestamps: true }
);

const Destination = mongoose.model("Destination", destinationSchema);

export default Destination;
