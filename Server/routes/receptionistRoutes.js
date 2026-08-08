import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getReservations,
  updateReservationStatus,
  markPaymentReceived,
  getAllRooms,
  createRoom,
  updateRoom,
  toggleRoomAvailability,
  deleteRoom,
  getAllServices,
  updateServiceStatus,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getAllReviews,
  toggleReviewVisibility,
} from "../controllers/receptionistController.js";

const receptionistRouter = express.Router();

// Reservations
receptionistRouter.get("/reservations", protect, getReservations);
receptionistRouter.patch("/reservations/:id/status", protect, updateReservationStatus);
receptionistRouter.post("/reservations/:id/payment", protect, markPaymentReceived);

// Rooms
receptionistRouter.get("/rooms", protect, getAllRooms);
receptionistRouter.post("/rooms", protect, createRoom);
receptionistRouter.put("/rooms/:id", protect, updateRoom);
receptionistRouter.patch("/rooms/:id/toggle", protect, toggleRoomAvailability);
receptionistRouter.delete("/rooms/:id", protect, deleteRoom);

// Services
receptionistRouter.get("/services", protect, getAllServices);
receptionistRouter.patch("/services/:id/status", protect, updateServiceStatus);

// Offers
receptionistRouter.get("/offers", protect, getAllOffers);
receptionistRouter.post("/offers", protect, createOffer);
receptionistRouter.put("/offers/:id", protect, updateOffer);
receptionistRouter.delete("/offers/:id", protect, deleteOffer);

// Reviews
receptionistRouter.get("/reviews", protect, getAllReviews);
receptionistRouter.patch("/reviews/:id/toggle", protect, toggleReviewVisibility);

export default receptionistRouter;
