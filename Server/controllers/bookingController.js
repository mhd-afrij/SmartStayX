import mongoose from "mongoose";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";
import { CLERK_API_BASE_URL } from "../configs/runtimeDefaults.js";
import bookingService from "../services/bookingService.js";
import WebhookLog from "../models/WebhookLog.js";
import { constructEvent, getStripe } from "../utils/stripeUtil.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";
import { BOOKING_ERRORS, BOOKING_SUCCESS } from "../constants/messages.js";
import bookingConfig from "../configs/bookingConfig.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fetchClerkDisplayName = async (userId) => {
  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret || !userId) return null;

  try {
    const response = await fetch(`${CLERK_API_BASE_URL}/users/${userId}`, {
      headers: { Authorization: `Bearer ${clerkSecret}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    const fullName = [data?.first_name, data?.last_name].filter(Boolean).join(" ").trim();
    return fullName || data?.username || null;
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------------------
// Public booking actions
// ---------------------------------------------------------------------------

export const checkAvailabilityAPI = async (req, res, next) => {
  try {
    const { room, checkInDate, checkOutDate } = req.body;
    const isAvailable = await bookingService.checkAvailability({ room, checkInDate, checkOutDate });
    res.json({ success: true, isAvailable });
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { room, checkInDate, checkOutDate, guests } = req.body;
    const result = await bookingService.createBooking({ userId, room, checkInDate, checkOutDate, guests });
    res.json({
      success: true,
      message: BOOKING_SUCCESS.CREATED,
      booking: result.booking,
      pricing: result.pricing,
      idempotencyKey: result.idempotencyKey,
      holdExpiresAt: result.holdExpiresAt,
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// User booking management
// ---------------------------------------------------------------------------

export const getUserBookings = async (req, res) => {
  try {
    const user = req.user._id;
    const bookings = await Booking.find({ user })
      .populate("room hotel")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    res.json({ success: false, message: BOOKING_ERRORS.FAILED_FETCH });
  }
};

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

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.json({ success: true, message: BOOKING_ERRORS.ALREADY_CANCELLED, booking });
    }

    if (booking.isPaid) {
      return res.json({ success: false, message: BOOKING_ERRORS.PAID_CANNOT_CANCEL });
    }

    const now = new Date();
    if (new Date(booking.checkInDate) <= now) {
      return res.json({ success: false, message: BOOKING_ERRORS.CANCELLED_ON_AFTER_CHECKIN });
    }

    booking.status = BOOKING_STATUS.CANCELLED;
    await booking.save();

    return res.json({ success: true, message: BOOKING_SUCCESS.CANCELLED, booking });
  } catch (error) {
    return res.json({ success: false, message: BOOKING_ERRORS.FAILED_CANCEL });
  }
};

export const modifyBooking = async (req, res) => {
  try {
    const user = req.user._id;
    const { bookingId, checkInDate, checkOutDate, guests } = req.body;

    if (!bookingId) {
      return res.json({ success: false, message: BOOKING_ERRORS.BOOKING_ID_REQUIRED });
    }

    const booking = await Booking.findOne({ _id: bookingId, user }).populate("room hotel");
    if (!booking) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_FOUND });
    }

    if (booking.status === BOOKING_STATUS.CANCELLED) {
      return res.json({ success: false, message: BOOKING_ERRORS.CANCELLED_CANNOT_MODIFY });
    }

    if (booking.isPaid) {
      return res.json({ success: false, message: BOOKING_ERRORS.PAID_CANNOT_MODIFY });
    }

    const now = new Date();
    if (new Date(booking.checkInDate) <= now) {
      return res.json({ success: false, message: BOOKING_ERRORS.MODIFY_ON_AFTER_CHECKIN });
    }

    const nextCheckInDate = checkInDate || booking.checkInDate;
    const nextCheckOutDate = checkOutDate || booking.checkOutDate;
    const nextGuests = Number(guests ?? booking.guests);

    const isAvailable = await bookingService.checkAvailability({
      room: booking.room._id,
      checkInDate: nextCheckInDate,
      checkOutDate: nextCheckOutDate,
      excludeBookingId: booking._id,
    });

    if (!isAvailable) {
      return res.json({ success: false, message: BOOKING_ERRORS.ROOM_NOT_AVAILABLE });
    }

    const roomData = await Room.findById(booking.room._id).populate("hotel");
    if (!roomData) {
      return res.json({ success: false, message: BOOKING_ERRORS.ROOM_NOT_FOUND });
    }

    if (!Number.isFinite(nextGuests) || nextGuests < 1) {
      return res.json({ success: false, message: BOOKING_ERRORS.GUESTS_MINIMUM });
    }

    const pricing = await bookingService.calculateBookingPricing({
      roomData,
      checkInDate: nextCheckInDate,
      checkOutDate: nextCheckOutDate,
      guests: nextGuests,
    });

    if (!pricing) {
      return res.json({ success: false, message: BOOKING_ERRORS.PRICING_FAILED });
    }

    booking.checkInDate = nextCheckInDate;
    booking.checkOutDate = nextCheckOutDate;
    booking.guests = pricing.guests;
    booking.nights = pricing.nights;
    booking.basePricePerNight = pricing.basePricePerNight;
    booking.dynamicPricePerNight = pricing.dynamicPricePerNight;
    booking.priceMultiplier = pricing.priceMultiplier;
    booking.totalPrice = pricing.totalPrice;
    booking.status = BOOKING_STATUS.PENDING;

    await booking.save();

    return res.json({
      success: true,
      message: BOOKING_SUCCESS.MODIFIED,
      booking,
    });
  } catch (error) {
    return res.json({ success: false, message: BOOKING_ERRORS.FAILED_MODIFY });
  }
};

// ---------------------------------------------------------------------------
// Payment actions
// ---------------------------------------------------------------------------

export const payBooking = async (req, res) => {
  try {
    const user = req.user._id;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.json({ success: false, message: BOOKING_ERRORS.BOOKING_ID_REQUIRED });
    }

    const booking = await Booking.findOne({ _id: bookingId, user });
    if (!booking) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_FOUND });
    }

    booking.isPaid = true;
    booking.status = BOOKING_STATUS.CONFIRMED;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.json({ success: false, message: BOOKING_ERRORS.FAILED_PAYMENT });
  }
};

export const setPaymentMethod = async (req, res) => {
  try {
    const user = req.user._id;
    const { bookingId, paymentMethod } = req.body;

    if (!bookingId || !paymentMethod) {
      return res.json({ success: false, message: BOOKING_ERRORS.BOOKING_ID_AND_METHOD_REQUIRED });
    }

    const booking = await Booking.findOne({ _id: bookingId, user });
    if (!booking) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_FOUND });
    }

    booking.paymentMethod = paymentMethod;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.json({ success: false, message: BOOKING_ERRORS.FAILED_UPDATE_PAYMENT });
  }
};

// ---------------------------------------------------------------------------
// Stripe
// ---------------------------------------------------------------------------

export const createCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.json({ success: false, message: BOOKING_ERRORS.STRIPE_NOT_CONFIGURED });

    const user = req.user._id;
    const { bookingId } = req.body;
    if (!bookingId) return res.json({ success: false, message: BOOKING_ERRORS.BOOKING_ID_REQUIRED });

    const booking = await Booking.findOne({ _id: bookingId, user }).populate("room hotel");
    if (!booking) return res.json({ success: false, message: BOOKING_ERRORS.NOT_FOUND });
    if (booking.isPaid) return res.json({ success: false, message: BOOKING_ERRORS.ALREADY_PAID });
    if (booking.status !== BOOKING_STATUS.PENDING) return res.json({ success: false, message: BOOKING_ERRORS.NOT_PENDING });
    if (booking.holdExpiresAt && new Date(booking.holdExpiresAt) <= new Date()) {
      return res.json({ success: false, message: BOOKING_ERRORS.HOLD_EXPIRED });
    }

    const frontendBaseUrl = process.env.FRONTEND_URL || req.headers.origin;
    if (!frontendBaseUrl) return res.status(500).json({ success: false, message: BOOKING_ERRORS.FRONTEND_URL_NOT_CONFIGURED });

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
              description: `Booking ${new Date(booking.checkInDate).toDateString()} to ${new Date(booking.checkOutDate).toDateString()}`,
            },
          },
        },
      ],
      success_url: `${frontendBaseUrl}/my-bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendBaseUrl}/my-bookings?payment=cancelled`,
      metadata: {
        bookingId: booking._id.toString(),
        userId: user.toString(),
        idempotencyKey: booking.idempotencyKey || "",
      },
    });

    booking.paymentMethod = "Stripe";
    await booking.save();
    return res.json({ success: true, sessionId: session.id, url: session.url });
  } catch (error) {
    next(error);
  }
};

export const confirmCheckoutSession = async (req, res, next) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.json({ success: false, message: BOOKING_ERRORS.STRIPE_NOT_CONFIGURED });

    const user = req.user._id;
    const { sessionId } = req.body;
    if (!sessionId) return res.json({ success: false, message: "sessionId is required" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const bookingId = session?.metadata?.bookingId;
    const sessionUserId = session?.metadata?.userId;

    if (!bookingId) return res.json({ success: false, message: BOOKING_ERRORS.SESSION_NOT_FOUND });
    if (sessionUserId && sessionUserId !== user.toString()) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_AUTHORIZED_PAYMENT });
    }

    const booking = await Booking.findOne({ _id: bookingId, user });
    if (!booking) return res.json({ success: false, message: BOOKING_ERRORS.NOT_FOUND });

    if (session.payment_status === "paid") {
      if (!booking.isPaid) {
        booking.isPaid = true;
        booking.status = BOOKING_STATUS.CONFIRMED;
        booking.paymentMethod = "Stripe";
        await booking.save();
      }
      return res.json({ success: true, paid: true, booking });
    }

    return res.json({ success: true, paid: false, message: BOOKING_ERRORS.PAYMENT_NOT_COMPLETED });
  } catch (error) {
    next(error);
  }
};

export const stripeWebhook = async (req, res, next) => {
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).send("Stripe webhook is not configured");

    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = constructEvent(req.body, sig);
    } catch (err) {
      return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
    }

    // Idempotency check
    const exists = await WebhookLog.findOne({ eventId: event.id });
    if (exists) return res.status(200).json({ received: true });

    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object;
      const bookingId = session?.metadata?.bookingId || session.client_reference_id;
      if (bookingId && session?.payment_status === "paid") {
        try {
          await bookingService.confirmPayment({ bookingId });
        } catch (err) {
          console.error("Failed to confirm payment via webhook:", err.message);
        }
      }
    }

    await WebhookLog.create({ eventId: event.id, payload: event });
    return res.status(200).json({ received: true });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------------------------
// Owner Booking Management
// ---------------------------------------------------------------------------

export const deleteOwnerBooking = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    const { bookingId } = req.params;

    if (!ownerId) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_AUTHORIZED });
    }

    if (!bookingId) {
      return res.json({ success: false, message: BOOKING_ERRORS.BOOKING_ID_REQUIRED });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_FOUND });
    }

    const ownerHotel = await Hotel.findOne({ _id: booking.hotel, owner: ownerId });
    if (!ownerHotel) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_AUTHORIZED_DELETE });
    }

    await Booking.findByIdAndDelete(bookingId);

    return res.json({ success: true, message: BOOKING_SUCCESS.BOOKING_DELETED });
  } catch (error) {
    return res.json({ success: false, message: BOOKING_ERRORS.FAILED_DELETE });
  }
};

export const updateOwnerBookingPayment = async (req, res) => {
  try {
    const ownerId = req.user?._id;
    const { bookingId, isPaid } = req.body;

    if (!ownerId) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_AUTHORIZED });
    }

    if (!bookingId || typeof isPaid !== "boolean") {
      return res.json({ success: false, message: BOOKING_ERRORS.BOOKING_ID_AND_PAYMENT_REQUIRED });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_FOUND });
    }

    const ownerHotel = await Hotel.findOne({ _id: booking.hotel, owner: ownerId });
    if (!ownerHotel) {
      return res.json({ success: false, message: BOOKING_ERRORS.NOT_AUTHORIZED_UPDATE });
    }

    booking.isPaid = isPaid;
    booking.paymentMethod = "Stripe";

    if (booking.status !== BOOKING_STATUS.CANCELLED) {
      booking.status = isPaid ? BOOKING_STATUS.CONFIRMED : BOOKING_STATUS.PENDING;
    }

    await booking.save();

    return res.json({ success: true, message: BOOKING_SUCCESS.PAYMENT_UPDATED, booking });
  } catch (error) {
    return res.json({ success: false, message: BOOKING_ERRORS.FAILED_OWNER_UPDATE });
  }
};

// ---------------------------------------------------------------------------
// Owner Dashboard
// ---------------------------------------------------------------------------

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
          activeStays: 0,
          occupiedRooms: 0,
          totalRooms: 0,
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
          allHotels: [],
        },
      });
    }

    let hotelMatch = {};
    let selectedHotel = null;

    if (hotelId && hotelId !== "all" && mongoose.Types.ObjectId.isValid(hotelId)) {
      try {
        hotelMatch = { hotel: new mongoose.Types.ObjectId(hotelId) };
        selectedHotel = allUserHotels.find((h) => h._id.toString() === hotelId);
      } catch {
        hotelMatch = {};
      }
    } else {
      const hotelIds = allUserHotels.map((h) => h._id);
      if (hotelIds.length > 0) {
        hotelMatch = { hotel: { $in: hotelIds } };
      }
    }

    const now = new Date();
    const today = new Date(now.toDateString());
    const trendDays = 7;
    const revenueDays = 30;
    const weekAgo = new Date(now.getTime() - trendDays * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - revenueDays * 24 * 60 * 60 * 1000);

    // Aggregation: compute metrics in one pass
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
                    $cond: [
                      {
                        $and: [
                          { $lte: ["$checkInDate", now] },
                          { $gte: ["$checkOutDate", now] },
                          { $ne: ["$status", BOOKING_STATUS.CANCELLED] },
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
                revenueToday: {
                  $sum: { $cond: [{ $gte: ["$createdAt", today] }, "$totalPrice", 0] },
                },
                revenueWeek: {
                  $sum: { $cond: [{ $gte: ["$createdAt", weekAgo] }, "$totalPrice", 0] },
                },
                revenueMonth: {
                  $sum: { $cond: [{ $gte: ["$createdAt", monthAgo] }, "$totalPrice", 0] },
                },
                upcomingBookings: {
                  $sum: {
                    $cond: [
                      { $and: [{ $gt: ["$checkInDate", now] }, { $ne: ["$status", BOOKING_STATUS.CANCELLED] }] },
                      1,
                      0,
                    ],
                  },
                },
                cancelledBookings: {
                  $sum: { $cond: [{ $eq: ["$status", BOOKING_STATUS.CANCELLED] }, 1, 0] },
                },
                lastMinuteBookings: {
                  $sum: {
                    $cond: [
                      {
                        $let: {
                          vars: {
                            hoursDiff: {
                              $divide: [{ $subtract: ["$checkInDate", "$createdAt"] }, 1000 * 60 * 60],
                            },
                          },
                          in: { $and: [{ $gt: ["$$hoursDiff", 0] }, { $lte: ["$$hoursDiff", bookingConfig.lastMinuteWindowHours] }] },
                        },
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const metrics = aggResult?.metrics[0] || {
      totalBookings: 0, totalRevenue: 0, activeStays: 0,
      revenueToday: 0, revenueWeek: 0, revenueMonth: 0,
      upcomingBookings: 0, cancelledBookings: 0, lastMinuteBookings: 0,
    };

    // Rooms
    const roomsMatch =
      hotelId && hotelId !== "all"
        ? { hotel: new mongoose.Types.ObjectId(hotelId) }
        : { hotel: { $in: allUserHotels.map((h) => h._id) } };

    const rooms = await Room.find(roomsMatch);
    const totalRooms = rooms.length;

    // Raw bookings with population
    const rawBookings = await Booking.find(hotelMatch)
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    // Occupancy: unique rooms currently occupied
    const occupiedRoomIds = new Set(
      rawBookings
        .filter(
          (b) =>
            b?.room?._id &&
            b.status !== BOOKING_STATUS.CANCELLED &&
            new Date(b.checkInDate) <= now &&
            new Date(b.checkOutDate) >= now,
        )
        .map((b) => b.room._id.toString()),
    );
    const occupiedRooms = occupiedRoomIds.size;
    const occupancyPercent = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Resolve guest display name with Clerk fallback
    const resolveGuestName = (booking) => {
      if (!booking?.user) return "Guest";

      const userDoc = booking.user;
      if (!userDoc || !userDoc._id) return "Guest";

      const clean = (value) => (value ? String(value).trim() : "");
      const isPlaceholder = (value) => {
        const v = clean(value).toLowerCase();
        return !v || v === "guest" || v === "user";
      };

      const nameCandidate = clean(userDoc.name);
      if (!isPlaceholder(nameCandidate)) return nameCandidate;

      const usernameCandidate = clean(userDoc.username);
      if (!isPlaceholder(usernameCandidate)) return usernameCandidate;

      const emailCandidate = clean(userDoc.email || booking?.guestEmail);
      if (emailCandidate && !emailCandidate.endsWith(bookingConfig.placeholderEmailDomain)) {
        return emailCandidate.split("@")[0];
      }

      const snapshotCandidate = clean(booking?.guestDisplayName);
      if (!isPlaceholder(snapshotCandidate)) return snapshotCandidate;

      return "Guest";
    };

    // Enrich bookings with resolved names
    const bookings = await Promise.all(
      rawBookings.map(async (booking) => {
        if (!booking || !booking._id) return null;

        const bookingObj = booking.toObject();
        let displayName = resolveGuestName(booking);

        if (displayName === "Guest" && booking.user?._id) {
          try {
            const clerkName = await fetchClerkDisplayName(booking.user._id.toString());
            if (clerkName) {
              displayName = clerkName;
              // Sync local user & backfill snapshot
              await User.findByIdAndUpdate(booking.user._id, {
                $set: { name: clerkName, username: clerkName },
              });
              await Booking.findByIdAndUpdate(booking._id, {
                $set: { guestDisplayName: clerkName },
              });
            }
          } catch (e) {
            console.warn("Failed clerk lookup:", e.message);
          }
        }

        bookingObj.guestDisplayName = displayName;
        return bookingObj;
      }),
    );

    const filteredBookings = bookings.filter(Boolean);

    // Trend
    const trends = Array.from({ length: trendDays }).map((_, idx) => {
      const day = new Date();
      day.setDate(now.getDate() - (6 - idx));
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      const bookingsCount = filteredBookings.filter(
        (b) => new Date(b.createdAt).toDateString() === day.toDateString(),
      ).length;
      return { label, bookings: bookingsCount };
    });

    res.json({
      success: true,
      dashboardData: {
        totalBookings: metrics.totalBookings,
        totalRevenue: metrics.totalRevenue,
        activeStays: metrics.activeStays,
        occupiedRooms,
        totalRooms,
        occupancyPercent,
        revenue: {
          today: metrics.revenueToday,
          week: metrics.revenueWeek,
          month: metrics.revenueMonth,
        },
        avgRating: null,
        upcomingBookings: metrics.upcomingBookings,
        cancelledBookings: metrics.cancelledBookings,
        lastMinuteBookings: metrics.lastMinuteBookings,
        bookings: filteredBookings,
        rooms,
        trends,
        hotel: selectedHotel || allUserHotels[0],
        allHotels: allUserHotels,
      },
    });
  } catch (error) {
    res.json({ success: false, message: BOOKING_ERRORS.FAILED_FETCH });
  }
};
