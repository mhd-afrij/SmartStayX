import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import roomValidators from "../validators/roomValidators.js";
import { createRoom, getRooms, getOwnerRooms, toggleRoomAvailability, updateRoom, getRoomById, deleteRoom, getTrendingRooms } from "../controllers/roomController.js";

// Room API routes.
const roomRouter = express.Router();

roomRouter.post("/", protect, upload.array("images", 4), validateRequest({ body: roomValidators.createRoomBody }), createRoom);
roomRouter.get("/", validateRequest({ query: roomValidators.getRoomsQuery }), getRooms);
roomRouter.get("/Owner", protect, getOwnerRooms);
roomRouter.get("/trending/list", getTrendingRooms);
roomRouter.post("/toggle-availability", protect, validateRequest({ body: roomValidators.toggleAvailabilityBody }), toggleRoomAvailability);
roomRouter.put("/:id", protect, validateRequest({ body: roomValidators.updateRoomBody }), updateRoom);
roomRouter.get("/:id", getRoomById);
roomRouter.delete("/:id", protect, deleteRoom);

export default roomRouter;
