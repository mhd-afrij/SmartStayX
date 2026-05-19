import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import { registerHotel, getOwnerHotel, getAllHotels, searchHotels, getHotelById, updateOwnerHotel, deleteOwnerHotel } from "../controllers/hotelController.js";

// Hotel API routes.
const hotelRouter = express.Router();

hotelRouter.post("/", protect, registerHotel);
hotelRouter.get("/owner", protect, getOwnerHotel);
hotelRouter.get("/all", getAllHotels);
hotelRouter.get("/search", searchHotels);
hotelRouter.get("/:id", getHotelById);
hotelRouter.put("/:id", protect, upload.single("image"), updateOwnerHotel);
hotelRouter.delete("/:id", protect, deleteOwnerHotel);

export default hotelRouter;
