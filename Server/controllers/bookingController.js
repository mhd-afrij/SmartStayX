import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js"; // Assuming you have a Hotel model
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// Function to check availability of rooms
const checkAvailability = async ({ checkInDate, checkOutDate, room }) => {
  try {
    const bookings = await Booking.find({
      room,
      checkInDate: { $lte: checkOutDate },
      checkOutDate: { $gte: checkInDate },
    });
    const isAvailable = bookings.length === 0;
    return isAvailable;
  } catch (error) {
    console.error(error.message);
  }
};

// API to check availability of room
// POST /api/bookings/check-availability
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    res.json({ success: true, isAvailable });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// API to create a new booking
// POST api/bookings/book
export const createBooking = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const user = req.user._id;

    const isAvailable = await checkAvailability({
      checkInDate,
      checkOutDate,
      room,
    });
    if (!isAvailable) {
      return res.json({ success: false, message: "Room is not available" });
    }

    // Get basic price from room
    const roomData = await Room.findById(room).populate("hotel");
    let basePricePerNight = roomData.pricePerNight;

    // -- Dynamic Pricing Algorithm --
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    let priceMultiplier = 1;
    const dayOfWeek = checkIn.getDay(); // 0 = Sun, 6 = Sat
    
    // 1. Weekend Surge: 15% increase for Friday or Saturday check-ins
    if (dayOfWeek === 5 || dayOfWeek === 6) {
        priceMultiplier += 0.15;
    }

    // 2. High Occupancy Surge: 10% increase if hotel > 80% full
    const totalHotelRooms = await Room.countDocuments({ hotel: roomData.hotel._id });
    const currentActiveBookings = await Booking.countDocuments({
      hotel: roomData.hotel._id,
      checkInDate: { $lte: checkInDate },
      checkOutDate: { $gte: checkInDate },
      status: { $ne: "cancelled" }
    });

    if (totalHotelRooms > 0 && (currentActiveBookings / totalHotelRooms) > 0.8) {
        priceMultiplier += 0.10;
    }

    const dynamicPricePerNight = Number((basePricePerNight * priceMultiplier).toFixed(2));
    const totalPrice = Number((dynamicPricePerNight * nights).toFixed(2));

    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      nights,
      basePricePerNight,
      dynamicPricePerNight,
      priceMultiplier: Number(priceMultiplier.toFixed(2)),
      totalPrice,
    });
    res.json({ success: true, message: "Booking created successfully", dynamicPriceApplied: priceMultiplier > 1 });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Failed to create booking" });
  }
};

// API to get all bookings for a user
// GET /api/bookings/user
export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings }); // Return bookings data
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};

// API to cancel a booking for current user
// POST /api/bookings/cancel
export const cancelBooking = async (req, res) => {
  try {
    const user = req.user._id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findOne({ _id: bookingId, user });
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.status === "cancelled") {
      return res.json({ success: true, message: "Booking is already cancelled", booking });
    }

    if (booking.isPaid) {
      return res.json({
        success: false,
        message: "Paid bookings cannot be cancelled online. Please contact support.",
      });
    }

    const now = new Date();
    if (new Date(booking.checkInDate) <= now) {
      return res.json({
        success: false,
        message: "Booking cannot be cancelled on or after check-in date",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    return res.json({ success: true, message: "Booking cancelled successfully", booking });
  } catch (error) {
    return res.json({ success: false, message: "Failed to cancel booking" });
  }
};

// API to mark a booking as paid (mock payment)
// POST /api/bookings/pay
export const payBooking = async (req, res) => {
  try {
    const user = req.user._id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findOne({ _id: bookingId, user });
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    booking.isPaid = true;
    booking.status = "confirmed";
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.json({ success: false, message: "Failed to process payment" });
  }
};

// API to update booking payment method without marking as paid
// POST /api/bookings/payment-method
export const setPaymentMethod = async (req, res) => {
  try {
    const user = req.user._id;
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.json({ success: false, message: "bookingId and paymentMethod are required" });
    }

    const booking = await Booking.findOne({ _id: bookingId, user });
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    booking.paymentMethod = paymentMethod;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.json({ success: false, message: "Failed to update payment method" });
  }
};

// API to create a Stripe checkout session
// POST /api/bookings/create-checkout-session
export const createCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.json({ success: false, message: "Stripe is not configured" });
    }

    const user = req.user._id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findOne({ _id: bookingId, user }).populate("room hotel");
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (booking.isPaid) {
      return res.json({ success: false, message: "Booking is already paid" });
    }

    const frontendBaseUrl =
      process.env.FRONTEND_URL ||
      req.headers.origin ||
      "http://localhost:5173";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: Math.round(Number(booking.totalPrice || 0) * 100),
            product_data: {
              name: `${booking.hotel?.name || "Hotel"} - ${booking.room?.roomType || "Room"}`,
              description: `Booking ${new Date(booking.checkInDate).toDateString()} to ${new Date(
                booking.checkOutDate
              ).toDateString()}`,
            },
          },
        },
      ],
      success_url: `${frontendBaseUrl}/my-bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBaseUrl}/my-bookings?payment=cancelled`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: user.toString(),
      },
    });

    booking.paymentMethod = "Stripe";
    await booking.save();

    return res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    return res.json({ success: false, message: "Failed to create checkout session" });
  }
};

// API to confirm checkout status after redirect from Stripe
// POST /api/bookings/confirm-checkout-session
export const confirmCheckoutSession = async (req, res) => {
  try {
    if (!stripe) {
      return res.json({ success: false, message: "Stripe is not configured" });
    }

    const user = req.user._id;
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.json({ success: false, message: "sessionId is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bookingId = session?.metadata?.bookingId;
    const sessionUserId = session?.metadata?.userId;

    if (!bookingId) {
      return res.json({ success: false, message: "Booking not found for this session" });
    }

    if (sessionUserId && sessionUserId !== user.toString()) {
      return res.json({ success: false, message: "You are not authorized for this payment" });
    }

    const booking = await Booking.findOne({ _id: bookingId, user });
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (session.payment_status === "paid") {
      if (!booking.isPaid) {
        booking.isPaid = true;
        booking.status = "confirmed";
        booking.paymentMethod = "Stripe";
        await booking.save();
      }
      return res.json({ success: true, paid: true, booking });
    }

    return res.json({ success: true, paid: false, message: "Payment is not completed yet" });
  } catch (error) {
    return res.json({ success: false, message: "Failed to confirm checkout session" });
  }
};

// Stripe webhook endpoint (raw body required)
// POST /api/bookings/stripe-webhook
export const stripeWebhook = async (req, res) => {
  try {
    if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
      return res.status(500).send("Stripe webhook is not configured");
    }

    const signature = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      return res.status(400).send(`Webhook signature verification failed: ${error.message}`);
    }

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      const bookingId = session?.metadata?.bookingId;

      if (bookingId && session?.payment_status === "paid") {
        const booking = await Booking.findById(bookingId);
        if (booking && !booking.isPaid) {
          booking.isPaid = true;
          booking.status = "confirmed";
          booking.paymentMethod = "Stripe";
          await booking.save();
        }
      }
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    return res.status(500).send("Webhook handler failed");
  }
};

// API for hotel owner to delete booking record
// DELETE /api/bookings/owner/:bookingId
export const deleteOwnerBooking = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    const { bookingId } = req.params;

    if (!ownerId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    if (!bookingId) {
      return res.json({ success: false, message: "bookingId is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    const ownerHotel = await Hotel.findOne({ _id: booking.hotel, owner: ownerId });
    if (!ownerHotel) {
      return res.json({ success: false, message: "Not authorized to delete this booking" });
    }

    await Booking.findByIdAndDelete(bookingId);

    return res.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    return res.json({ success: false, message: "Failed to delete booking" });
  }
};

// API for hotel owner to manage booking payment
// POST /api/bookings/owner/update-payment
export const updateOwnerBookingPayment = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    const { bookingId, isPaid } = req.body;

    if (!ownerId) {
      return res.json({ success: false, message: "Not authenticated" });
    }

    if (!bookingId || typeof isPaid !== "boolean") {
      return res.json({ success: false, message: "bookingId and isPaid are required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    const ownerHotel = await Hotel.findOne({ _id: booking.hotel, owner: ownerId });
    if (!ownerHotel) {
      return res.json({ success: false, message: "Not authorized to update this booking" });
    }

    booking.isPaid = isPaid;

    // Owner payment management uses Stripe only.
    booking.paymentMethod = "Stripe";

    if (booking.status !== "cancelled") {
      booking.status = isPaid ? "confirmed" : "pending";
    }

    await booking.save();

    return res.json({ success: true, message: "Payment updated successfully", booking });
  } catch (error) {
    return res.json({ success: false, message: "Failed to update payment" });
  }
};

// API to get all bookings for a hotel
// GET /api/bookings/hotel
export const getHotelBookings = async (req, res) => {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const userId = auth?.userId;
    const { hotelId } = req.query;

    const allUserHotels = await Hotel.find({ owner: userId });
    
    if (!allUserHotels || allUserHotels.length === 0) {
      return res.json({ 
         success: true, 
         dashboardData: {
            totalBookings: 0,
            totalRevenue: 0,
            occupancyPercent: 0,
            revenue: { today: 0, week: 0, month: 0 },
            avgRating: null,
            upcomingBookings: 0,
            cancelledBookings: 0,
            lastMinuteBookings: 0,
            bookings: [],
            rooms: [],
            trends: [],
            hotel: null,
            allHotels: []
         } 
      });
    }

    let hotelMatch = {};
    let selectedHotel = null;

    if (hotelId && hotelId !== "all") {
        hotelMatch = { hotel: new mongoose.Types.ObjectId(hotelId) };
        selectedHotel = allUserHotels.find(h => h._id.toString() === hotelId);
    } else {
        const hotelIds = allUserHotels.map(h => h._id);
        hotelMatch = { hotel: { $in: hotelIds } };
    }


    const now = new Date();
    const today = new Date(now.toDateString());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // -- MongoDB Aggregation Logic --
    const [aggResult] = await Booking.aggregate([
      { $match: hotelMatch },
      {
        $facet: {
          metrics: [
            {
              $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                totalRevenue: { $sum: "$totalPrice" },
                activeStays: {
                  $sum: {
                    $cond: [{ $and: [{ $lte: ["$checkInDate", now] }, { $gte: ["$checkOutDate", now] }, { $ne: ["$status", "cancelled"] }] }, 1, 0]
                  }
                },
                revenueToday: { $sum: { $cond: [{ $gte: ["$createdAt", today] }, "$totalPrice", 0] } },
                revenueWeek: { $sum: { $cond: [{ $gte: ["$createdAt", weekAgo] }, "$totalPrice", 0] } },
                revenueMonth: { $sum: { $cond: [{ $gte: ["$createdAt", monthAgo] }, "$totalPrice", 0] } },
                upcomingBookings: {
                  $sum: { $cond: [{ $and: [{ $gt: ["$checkInDate", now] }, { $ne: ["$status", "cancelled"] }] }, 1, 0] }
                },
                cancelledBookings: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
                lastMinuteBookings: {
                  $sum: {
                    $cond: [
                      {
                        $let: {
                          vars: { hoursDiff: { $divide: [{ $subtract: ["$checkInDate", "$createdAt"] }, 1000 * 60 * 60] } },
                          in: { $and: [{ $gt: ["$$hoursDiff", 0] }, { $lte: ["$$hoursDiff", 48] }] }
                        }
                      }, 1, 0
                    ]
                  }
                }
              }
            }
          ]
        }
      }
    ]);

    const metrics = aggResult?.metrics[0] || {
      totalBookings: 0, totalRevenue: 0, activeStays: 0, revenueToday: 0,
      revenueWeek: 0, revenueMonth: 0, upcomingBookings: 0, cancelledBookings: 0, lastMinuteBookings: 0
    };

    const roomsMatch = hotelId && hotelId !== "all" 
        ? { hotel: new mongoose.Types.ObjectId(hotelId) } 
        : { hotel: { $in: allUserHotels.map(h => h._id) } };

    const rooms = await Room.find(roomsMatch);
    const totalRooms = rooms.length || 0;
    const occupancyPercent = totalRooms ? Math.round((metrics.activeStays / totalRooms) * 100) : 0;

    const bookings = await Booking.find(hotelMatch).populate("room hotel user").sort({ createdAt: -1 });

    const trends = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date();
      day.setDate(now.getDate() - (6 - idx));
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      const bookingsCount = bookings.filter((b) => new Date(b.createdAt).toDateString() === day.toDateString()).length;
      return { label, bookings: bookingsCount };
    });

    res.json({
      success: true,
      dashboardData: {
        totalBookings: metrics.totalBookings,
        totalRevenue: metrics.totalRevenue,
        occupancyPercent,
        revenue: { today: metrics.revenueToday, week: metrics.revenueWeek, month: metrics.revenueMonth },
        avgRating: null,
        upcomingBookings: metrics.upcomingBookings,
        cancelledBookings: metrics.cancelledBookings,
        lastMinuteBookings: metrics.lastMinuteBookings,
        bookings,
        rooms,
        trends,
        hotel: selectedHotel || allUserHotels[0],
        allHotels: allUserHotels,
      },
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};
