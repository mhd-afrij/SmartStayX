import express from "express"
import upload from "../middleware/uploadMIddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import { createRoom, getOwnerRooms, getRooms, toggleRoomAvailability, deleteRoom, getRoomById, updateRoom } from "../controllers/roomController.js";


const roomRouter =express.Router();

roomRouter.post('/',upload.array("images",4),protect,createRoom)
roomRouter.get('/',getRooms)
roomRouter.get('/Owner',protect,getOwnerRooms)
roomRouter.post('/toggle-availability',protect,toggleRoomAvailability)
roomRouter.put('/:id',protect,updateRoom)
roomRouter.get('/:id',getRoomById)
roomRouter.delete('/:id',protect,deleteRoom)

export default roomRouter;