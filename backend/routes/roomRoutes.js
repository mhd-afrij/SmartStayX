// roomRoutes.js — Room CRUD, availability toggle, and search routes
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import roomValidators from "../validators/roomValidators.js";
import { createRoom, getRooms, getOwnerRooms, toggleRoomAvailability, updateRoom, getRoomById, deleteRoom, getTrendingRooms, suggestRoomNumber } from "../controllers/roomController.js";

// Room API routes.
const roomRouter = express.Router();

// POST / — Create a new room with up to 4 images (auth required)
roomRouter.post("/", protect, upload.array("images", 4), validateRequest({ body: roomValidators.createRoomBody }), createRoom);
// GET / — Get rooms with filtering and pagination query params (public)
roomRouter.get("/", validateRequest({ query: roomValidators.getRoomsQuery }), getRooms);
// GET /Owner — Get rooms belonging to the authenticated owner
roomRouter.get("/Owner", protect, getOwnerRooms);
roomRouter.get("/owner", protect, getOwnerRooms);
// GET /trending/list — Get trending/popular rooms list (public)
roomRouter.get("/trending/list", getTrendingRooms);
// POST /toggle-availability — Toggle room availability on/off (auth required)
roomRouter.post("/toggle-availability", protect, validateRequest({ body: roomValidators.toggleAvailabilityBody }), toggleRoomAvailability);
// GET /next-number/:hotelId — Suggest next room number for a hotel (based on city prefix)
roomRouter.get("/next-number/:hotelId", protect, suggestRoomNumber);
// PUT /:id — Update a room by ID (auth required)
roomRouter.put("/:id", protect, validateRequest({ body: roomValidators.updateRoomBody }), updateRoom);
// GET /:id — Get a single room by ID (public)
roomRouter.get("/:id", getRoomById);
// DELETE /:id — Delete a room by ID (auth required)
roomRouter.delete("/:id", protect, deleteRoom);

export default roomRouter;
