import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMIddleware.js";
import { registerHotel, getOwnerHotel, getAllHotels, updateOwnerHotel, getHotelById, searchHotels, deleteOwnerHotel } from "../controllers/hotelController.js";

const hotelRouter = express. Router();

hotelRouter.post( '/' , protect, registerHotel);
hotelRouter.get('/owner', protect, getOwnerHotel);
hotelRouter.get('/all', getAllHotels);
hotelRouter.get('/search', searchHotels);
hotelRouter.get('/:id', getHotelById);
hotelRouter.put('/:id', protect, upload.single('image'), updateOwnerHotel);
hotelRouter.delete('/:id', protect, deleteOwnerHotel);

export default hotelRouter;
