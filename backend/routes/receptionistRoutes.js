import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { requireRole, requireHotelScope } from "../middleware/authorization.js";
import validateRequest from "../middleware/validateRequest.js";
import {
  createReservationBody,
  updateReservationBody,
  updateReservationStatusBody,
  markPaymentReceivedBody,
  frontDeskCheckinBody,
  frontDeskCheckoutBody,
  createRoomBody,
  updateRoomBody,
  updateRoomStatusBody,
  updateServiceStatusBody,
  assignServiceBody,
  createOfferBody,
  updateOfferBody,
} from "../validators/receptionistValidators.js";
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
receptionistRouter.post("/reservations", validateRequest({ body: createReservationBody }), createReservation);
receptionistRouter.put("/reservations/:id", validateRequest({ body: updateReservationBody }), updateReservation);
receptionistRouter.patch("/reservations/:id/status", validateRequest({ body: updateReservationStatusBody }), updateReservationStatus);
receptionistRouter.post("/reservations/:id/payment", validateRequest({ body: markPaymentReceivedBody }), markPaymentReceived);

// Guest management
receptionistRouter.get("/guests", getGuests);
receptionistRouter.get("/guests/:id", getGuestDetail);

// Front desk check-in / check-out
receptionistRouter.post("/checkin", validateRequest({ body: frontDeskCheckinBody }), frontDeskCheckin);
receptionistRouter.post("/checkout", validateRequest({ body: frontDeskCheckoutBody }), frontDeskCheckout);

// Rooms
receptionistRouter.get("/rooms", getAllRooms);
receptionistRouter.post("/rooms", validateRequest({ body: createRoomBody }), createRoom);
receptionistRouter.put("/rooms/:id", validateRequest({ body: updateRoomBody }), updateRoom);
receptionistRouter.patch("/rooms/:id/toggle", toggleRoomAvailability);
receptionistRouter.patch("/rooms/:id/status", validateRequest({ body: updateRoomStatusBody }), updateRoomStatus);
receptionistRouter.delete("/rooms/:id", deleteRoom);

// Services
receptionistRouter.get("/services", getAllServices);
receptionistRouter.patch("/services/:id/status", validateRequest({ body: updateServiceStatusBody }), updateServiceStatus);
receptionistRouter.patch("/services/:id/assign", validateRequest({ body: assignServiceBody }), assignService);

// Offers
receptionistRouter.get("/offers", getAllOffers);
receptionistRouter.post("/offers", validateRequest({ body: createOfferBody }), createOffer);
receptionistRouter.put("/offers/:id", validateRequest({ body: updateOfferBody }), updateOffer);
receptionistRouter.delete("/offers/:id", deleteOffer);

// Reviews
receptionistRouter.get("/reviews", getAllReviews);
receptionistRouter.patch("/reviews/:id/toggle", toggleReviewVisibility);

export default receptionistRouter;
