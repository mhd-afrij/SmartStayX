import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, requireHotelScope } from "../middleware/authorization.js";
import {
  getDashboardSummary,
  getReservations,
  getReservationDetail,
  createReservation,
  updateReservation,
  updateReservationStatus,
  markPaymentReceived,
  getAllRooms,
  createRoom,
  updateRoom,
  toggleRoomAvailability,
  updateRoomStatus,
  deleteRoom,
  getAllServices,
  updateServiceStatus,
  assignService,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getAllReviews,
  toggleReviewVisibility,
  getGuests,
  getGuestDetail,
  frontDeskCheckin,
  frontDeskCheckout,
} from "../controllers/receptionistController.js";

const receptionistRouter = express.Router();

// All receptionist routes require receptionist, hotel_manager, or super_admin.
// Non-super-admin users are additionally scoped to their assigned hotel
// (see requireHotelScope): a receptionist at hotel A cannot read or modify
// bookings/rooms/services of hotel B.
receptionistRouter.use(protect, requireRole("receptionist", "hotel_manager", "super_admin"), requireHotelScope);

// Front Desk dashboard
receptionistRouter.get("/dashboard", getDashboardSummary);

// Reservations
receptionistRouter.get("/reservations", getReservations);
receptionistRouter.get("/reservations/:id", getReservationDetail);
receptionistRouter.post("/reservations", createReservation);
receptionistRouter.put("/reservations/:id", updateReservation);
receptionistRouter.patch("/reservations/:id/status", updateReservationStatus);
receptionistRouter.post("/reservations/:id/payment", markPaymentReceived);

// Guest management
receptionistRouter.get("/guests", getGuests);
receptionistRouter.get("/guests/:id", getGuestDetail);

// Front desk check-in / check-out
receptionistRouter.post("/checkin", frontDeskCheckin);
receptionistRouter.post("/checkout", frontDeskCheckout);

// Rooms
receptionistRouter.get("/rooms", getAllRooms);
receptionistRouter.post("/rooms", createRoom);
receptionistRouter.put("/rooms/:id", updateRoom);
receptionistRouter.patch("/rooms/:id/toggle", toggleRoomAvailability);
receptionistRouter.patch("/rooms/:id/status", updateRoomStatus);
receptionistRouter.delete("/rooms/:id", deleteRoom);

// Services
receptionistRouter.get("/services", getAllServices);
receptionistRouter.patch("/services/:id/status", updateServiceStatus);
receptionistRouter.patch("/services/:id/assign", assignService);

// Offers
receptionistRouter.get("/offers", getAllOffers);
receptionistRouter.post("/offers", createOffer);
receptionistRouter.put("/offers/:id", updateOffer);
receptionistRouter.delete("/offers/:id", deleteOffer);

// Reviews
receptionistRouter.get("/reviews", getAllReviews);
receptionistRouter.patch("/reviews/:id/toggle", toggleReviewVisibility);

export default receptionistRouter;
