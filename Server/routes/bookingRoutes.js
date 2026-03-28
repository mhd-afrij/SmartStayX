import express from 'express';
import { cancelBooking, checkAvailabilityAPI, confirmCheckoutSession, createBooking, createCheckoutSession, deleteOwnerBooking, getHotelBookings, getUserBookings, payBooking, setPaymentMethod, updateOwnerBookingPayment } from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const bookingRouter =express.Router();
bookingRouter. post('/check-availability',checkAvailabilityAPI);
bookingRouter.post('/book',protect,createBooking);
bookingRouter.post('/create-checkout-session',protect,createCheckoutSession);
bookingRouter.post('/confirm-checkout-session',protect,confirmCheckoutSession);
bookingRouter.post('/cancel',protect,cancelBooking);
bookingRouter.post('/pay',protect,payBooking);
bookingRouter.post('/payment-method',protect,setPaymentMethod);
bookingRouter.get('/user',protect,getUserBookings);
bookingRouter.get('/hotel',protect,getHotelBookings);
bookingRouter.delete('/owner/:bookingId',protect,deleteOwnerBooking);
bookingRouter.post('/owner/update-payment',protect,updateOwnerBookingPayment);

export default bookingRouter;