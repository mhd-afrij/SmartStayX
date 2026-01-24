import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { registerHotel, getOwnerHotel, getAllHotels } from "../controllers/hotelController.js";

const hotelRouter = express. Router();

hotelRouter.post( '/' , protect, registerHotel);
hotelRouter.get('/owner', protect, getOwnerHotel);
hotelRouter.get('/all', getAllHotels);

export default hotelRouter;
