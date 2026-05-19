import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import validateRequest from "../middleware/validateRequest.js";
import bookingValidators from "../validators/bookingValidators.js";
import { checkAvailabilityAPI, createBooking, createCheckoutSession, confirmCheckoutSession, cancelBooking, modifyBooking, payBooking, setPaymentMethod, getUserBookings, getHotelBookings, deleteOwnerBooking, updateOwnerBookingPayment } from "../controllers/bookingController.js";

// Booking API routes.
const bookingRouter = express.Router();

bookingRouter.post("/check-availability", validateRequest({ body: bookingValidators.checkAvailabilityBody }), checkAvailabilityAPI);
bookingRouter.post("/book", protect, validateRequest({ body: bookingValidators.createBookingBody }), createBooking);
bookingRouter.post("/create-checkout-session", protect, validateRequest({ body: bookingValidators.bookingIdBody }), createCheckoutSession);
bookingRouter.post("/confirm-checkout-session", protect, validateRequest({ body: bookingValidators.sessionIdBody }), confirmCheckoutSession);
bookingRouter.post("/cancel", protect, validateRequest({ body: bookingValidators.bookingIdBody }), cancelBooking);
bookingRouter.post("/modify", protect, validateRequest({ body: bookingValidators.modifyBookingBody }), modifyBooking);
bookingRouter.post("/pay", protect, validateRequest({ body: bookingValidators.bookingIdBody }), payBooking);
bookingRouter.post("/payment-method", protect, validateRequest({ body: bookingValidators.paymentMethodBody }), setPaymentMethod);
bookingRouter.get("/user", protect, getUserBookings);
bookingRouter.get("/hotel", protect, getHotelBookings);
bookingRouter.delete("/owner/:bookingId", protect, deleteOwnerBooking);
bookingRouter.post("/owner/update-payment", protect, updateOwnerBookingPayment);

export default bookingRouter;
