import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Offer from "../models/Offer.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Checkin from "../models/Checkin.js";
import Notification from "../models/Notification.js";
import { transitionBookingStatus, canTransition } from "../services/bookingStatusService.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";

// ─── Hotel scope helpers ──────────────────────────────────────────────
// requireHotelScope (see middleware/authorization.js) sets req.scopeHotelId
// to the acting user's assigned hotel (super_admin is unrestricted). These
// helpers keep every read scoped and every write verified against that hotel.

// Filter that restricts a query to the user's assigned hotel ({} for super_admin).
const scopeHotelFilter = (req) => (req.scopeHotelId ? { hotel: req.scopeHotelId } : {});

const hotelInScope = (req, hotelId) => {
  if (!req.scopeHotelId) return true; // super_admin — global access
  return String(hotelId) === String(req.scopeHotelId);
};

// Verifies the acting user may operate on `hotelId`; sends 403 and returns
// false when they may not.
const assertHotelScope = (req, res, hotelId) => {
  if (hotelInScope(req, hotelId)) return true;
  res.json({ success: false, message: "Access denied: hotel scope violation" });
  return false;
};

// Maps a Booking document to the lean shape consumed by the receptionist UI.
const enrichReservation = (b) => ({
  _id: b._id,
  guestName: b.guestDisplayName || b.user?.name || b.user?.username || "Guest",
  guestEmail: b.guestEmail || b.user?.email || "",
  guestPhone: b.user?.profile?.phone || "",
  hotel: b.hotel?.name || "Hotel",
  hotelId: b.hotel?._id,
  roomNumber: b.roomNumber || b.room?.roomNumber || "",
  roomType: b.room?.roomType || "",
  checkInDate: b.checkInDate,
  checkOutDate: b.checkOutDate,
  nights: b.nights,
  totalPrice: b.totalPrice,
  status: b.status,
  paymentMethod: b.paymentMethod,
  isPaid: b.isPaid,
  guests: b.guests,
  createdAt: b.createdAt,
  statusHistory: b.statusHistory,
});

// Normalises an arbitrary payment method value to the stored string.
const normalizePaymentMethod = (value) => {
  if (!value) return "Pay At Hotel";
  const v = String(value);
  if (["Cash", "Card", "Online", "Pay At Hotel"].includes(v)) return v;
  return "Pay At Hotel";
};

// True when the method represents an immediate payment taken at the desk.
const isPaidMethod = (value) => ["Cash", "Card", "Online"].includes(normalizePaymentMethod(value));

export const getReservations = async (req, res) => {
  try {
    const { hotelId, status, search } = req.query;
    const filter = { ...scopeHotelFilter(req) };

    if (hotelId && hotelId !== "all") {
      // A scoped user may only ever request their own hotel.
      if (!hotelInScope(req, hotelId)) {
        return res.json({ success: false, message: "Access denied: hotel scope violation" });
      }
      filter.hotel = hotelId;
    }

    if (status && status !== "all") {
      filter.status = status;
    }

    let bookings = await Booking.find(filter)
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    if (search) {
      const q = search.toLowerCase();
      bookings = bookings.filter((b) => {
        const name = (b.guestDisplayName || b.user?.name || b.user?.username || "").toLowerCase();
        const roomNum = (b.roomNumber || b.room?.roomNumber || "").toLowerCase();
        const hotelName = (b.hotel?.name || "").toLowerCase();
        return name.includes(q) || roomNum.includes(q) || hotelName.includes(q);
      });
    }

    const hotels = await Hotel.find(req.scopeHotelId ? { _id: req.scopeHotelId } : {}).select("name");

    const enriched = bookings.map((b) => enrichReservation(b));

    res.json({
      success: true,
      reservations: enriched,
      hotels,
      total: enriched.length,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateReservationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["confirmed", "checked_in", "checked_out", "cancelled"];

    if (!allowed.includes(status)) {
      return res.json({ success: false, message: `Invalid status. Allowed: ${allowed.join(", ")}` });
    }

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (!assertHotelScope(req, res, booking.hotel)) return;

    // Route through the shared transition validator so status history is
    // recorded and illegal jumps (e.g. pending -> checked_in) are rejected.
    if (!canTransition(booking.status, status)) {
      return res.json({ success: false, message: `Invalid booking status transition: ${booking.status} → ${status}` });
    }

    await transitionBookingStatus({
      booking,
      to: status,
      options: { actor: String(req.user._id), reason: "Receptionist updated booking status" },
    });

    res.json({ success: true, message: `Status updated to ${status}`, booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const markPaymentReceived = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (!assertHotelScope(req, res, booking.hotel)) return;

    if (paymentMethod && paymentMethod !== "unpaid") {
      booking.paymentMethod = normalizePaymentMethod(paymentMethod);
      booking.paymentReceivedAt = booking.paymentReceivedAt || new Date();
    } else {
      booking.paymentMethod = "Pay At Hotel";
    }
    booking.isPaid = true;
    if (booking.status === BOOKING_STATUS.PENDING) {
      // Payment at the front desk confirms the reservation.
      await transitionBookingStatus({
        booking,
        to: BOOKING_STATUS.CONFIRMED,
        options: { actor: String(req.user._id), reason: "Payment received at hotel" },
      });
    } else {
      await booking.save();
    }

    res.json({ success: true, message: "Payment marked as received", booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Rooms ──────────────────────────────────────────────────────────

export const getAllRooms = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const filter = { ...scopeHotelFilter(req) };
    if (hotelId && hotelId !== "all") {
      if (!hotelInScope(req, hotelId)) {
        return res.json({ success: false, message: "Access denied: hotel scope violation" });
      }
      filter.hotel = hotelId;
    }
    const rooms = await Room.find(filter).populate("hotel", "name").sort({ createdAt: -1 });
    const hotels = await Hotel.find(req.scopeHotelId ? { _id: req.scopeHotelId } : {}).select("name");
    res.json({ success: true, rooms, hotels });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { roomNumber, roomType, pricePerNight, amenities, hotelId, images } = req.body;
    if (!roomNumber || !roomType || !pricePerNight || !hotelId) {
      return res.json({ success: false, message: "Missing required fields" });
    }
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.json({ success: false, message: "Hotel not found" });
    if (!assertHotelScope(req, res, hotelId)) return;
    const room = await Room.create({
      hotel: hotelId,
      hotelName: hotel.name,
      hotelAddress: hotel.address || "",
      hotelCity: hotel.city || "",
      roomNumber,
      roomType,
      pricePerNight: Number(pricePerNight),
      amenities: amenities || [],
      images: images || [],
      isAvailable: true,
    });
    res.json({ success: true, message: "Room created", room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { roomNumber, roomType, pricePerNight, amenities, isAvailable } = req.body;
    const room = await Room.findById(id);
    if (!room) return res.json({ success: false, message: "Room not found" });
    if (!assertHotelScope(req, res, room.hotel)) return;
    if (roomNumber !== undefined) room.roomNumber = roomNumber;
    if (roomType !== undefined) room.roomType = roomType;
    if (pricePerNight !== undefined) room.pricePerNight = Number(pricePerNight);
    if (amenities !== undefined) room.amenities = amenities;
    if (isAvailable !== undefined) room.isAvailable = isAvailable === true || isAvailable === "true";
    await room.save();
    res.json({ success: true, message: "Room updated", room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const toggleRoomAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    if (!room) return res.json({ success: false, message: "Room not found" });
    if (!assertHotelScope(req, res, room.hotel)) return;
    room.isAvailable = !room.isAvailable;
    await room.save();
    res.json({ success: true, message: `Room ${room.isAvailable ? "available" : "unavailable"}`, room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id);
    if (!room) return res.json({ success: false, message: "Room not found" });
    if (!assertHotelScope(req, res, room.hotel)) return;
    await Room.findByIdAndDelete(id);
    res.json({ success: true, message: "Room deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const ROOM_STATUSES = ["available", "occupied", "reserved", "cleaning", "maintenance", "out_of_service"];

export const updateRoomStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!ROOM_STATUSES.includes(status)) {
      return res.json({ success: false, message: `Invalid status. Allowed: ${ROOM_STATUSES.join(", ")}` });
    }
    const room = await Room.findById(id);
    if (!room) return res.json({ success: false, message: "Room not found" });
    if (!assertHotelScope(req, res, room.hotel)) return;
    room.status = status;
    room.isAvailable = status === "available";
    await room.save();
    res.json({ success: true, message: `Room status updated to ${status}`, room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Services ────────────────────────────────────────────────────────

export const getAllServices = async (req, res) => {
  try {
    const { assignedTo, scope } = req.query;
    const filter = { ...scopeHotelFilter(req) };

    if (assignedTo === "me") {
      filter.assignedTo = req.user._id;
    } else if (assignedTo === "unassigned") {
      filter.assignedTo = null;
    } else if (typeof assignedTo === "string" && assignedTo.length) {
      filter.assignedTo = assignedTo;
    }

    if (scope === "open") {
      filter.status = { $in: ["pending", "assigned"] };
    }

    const services = await ServiceRequest.find(filter)
      .populate("room", "roomNumber roomType")
      .populate("guest", "name username")
      .populate("assignedTo", "name username")
      .sort({ createdAt: -1 });
    res.json({ success: true, services });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ["pending", "assigned", "completed", "cancelled"];
    if (!allowed.includes(status)) {
      return res.json({ success: false, message: `Invalid status. Allowed: ${allowed.join(", ")}` });
    }
    const service = await ServiceRequest.findById(id);
    if (!service) return res.json({ success: false, message: "Service request not found" });
    if (!assertHotelScope(req, res, service.hotel)) return;
    service.status = status;
    if (status === "completed") service.completedAt = new Date();
    await service.save();
    res.json({ success: true, message: `Service marked as ${status}`, service });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const assignService = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;
    const service = await ServiceRequest.findById(id);
    if (!service) return res.json({ success: false, message: "Service request not found" });
    if (!assertHotelScope(req, res, service.hotel)) return;

    if (assignedTo === "me") {
      service.assignedTo = req.user._id;
      if (service.status === "pending") service.status = "assigned";
    } else if (!assignedTo) {
      service.assignedTo = null;
    } else {
      service.assignedTo = assignedTo;
      if (service.status === "pending") service.status = "assigned";
    }

    await service.save();
    const updated = await ServiceRequest.findById(id)
      .populate("room", "roomNumber roomType")
      .populate("guest", "name username")
      .populate("assignedTo", "name username");
    res.json({ success: true, message: "Task assignment updated", service: updated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Offers ──────────────────────────────────────────────────────────

export const getAllOffers = async (req, res) => {
  try {
    const offers = await Offer.find(scopeHotelFilter(req))
      .populate("room", "roomNumber roomType pricePerNight")
      .populate("hotel", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, offers });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const createOffer = async (req, res) => {
  try {
    const { title, description, discountPercent, expiryDate, roomId, hotelId, image } = req.body;
    if (!title || !description || discountPercent === undefined || !expiryDate || !roomId || !hotelId) {
      return res.json({ success: false, message: "Missing required fields" });
    }
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.json({ success: false, message: "Hotel not found" });
    if (!assertHotelScope(req, res, hotelId)) return;
    const offer = await Offer.create({
      title,
      description,
      discountPercent: Number(discountPercent),
      expiryDate,
      image: image || "",
      room: roomId,
      hotel: hotelId,
      owner: req.user._id,
      isActive: true,
    });
    res.json({ success: true, message: "Offer created", offer });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, discountPercent, expiryDate, isActive } = req.body;
    const offer = await Offer.findById(id);
    if (!offer) return res.json({ success: false, message: "Offer not found" });
    if (!assertHotelScope(req, res, offer.hotel)) return;
    if (title !== undefined) offer.title = title;
    if (description !== undefined) offer.description = description;
    if (discountPercent !== undefined) offer.discountPercent = Number(discountPercent);
    if (expiryDate !== undefined) offer.expiryDate = expiryDate;
    if (isActive !== undefined) offer.isActive = Boolean(isActive);
    await offer.save();
    const updated = await Offer.findById(id).populate("room", "roomNumber roomType").populate("hotel", "name");
    res.json({ success: true, message: "Offer updated", offer: updated });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    if (!offer) return res.json({ success: false, message: "Offer not found" });
    if (!assertHotelScope(req, res, offer.hotel)) return;
    await Offer.findByIdAndDelete(id);
    res.json({ success: true, message: "Offer deleted" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// ─── Reviews ─────────────────────────────────────────────────────────

export const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find(scopeHotelFilter(req))
      .populate("user", "name username image")
      .populate("room", "roomNumber roomType")
      .populate("hotel", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const toggleReviewVisibility = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await Review.findById(id);
    if (!review) return res.json({ success: false, message: "Review not found" });
    if (!assertHotelScope(req, res, review.hotel)) return;
    review.isVisible = !review.isVisible;
    await review.save();
    res.json({ success: true, message: `Review ${review.isVisible ? "visible" : "hidden"}`, isVisible: review.isVisible });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// ─── Front Desk Dashboard ──────────────────────────────────────────────

export const getDashboardSummary = async (req, res) => {
  try {
    const hotelFilter = scopeHotelFilter(req);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    // ── Rooms grouped by operational status ─────────────────────────
    const rooms = await Room.find(hotelFilter).lean();
    const roomCounts = { total: rooms.length, available: 0, occupied: 0, cleaning: 0, maintenance: 0, reserved: 0, out_of_service: 0 };
    rooms.forEach((r) => {
      const s = r.status || "available";
      if (roomCounts[s] !== undefined) roomCounts[s] += 1;
      else roomCounts.available += 1;
    });

    // ── Bookings / guest metrics ─────────────────────────────────────
    const bookings = await Booking.find(hotelFilter).lean();
    const activeBooking = (b) => !["cancelled", "expired"].includes(b.status);

    const arrivalsToday = bookings.filter(
      (b) => b.checkInDate >= startOfToday && b.checkInDate < endOfToday && ["confirmed", "checked_in"].includes(b.status)
    ).length;
    const departuresToday = bookings.filter(
      (b) => b.checkOutDate >= startOfToday && b.checkOutDate < endOfToday && ["checked_in", "checked_out"].includes(b.status)
    ).length;
    const inHouse = bookings.filter((b) => b.status === "checked_in").length;
    const pendingCheckins = bookings.filter((b) => b.status === "confirmed" && new Date(b.checkInDate) <= now).length;
    const pendingCheckouts = bookings.filter((b) => b.status === "checked_in" && new Date(b.checkOutDate) <= now).length;

    // ── Payments ─────────────────────────────────────────────────────
    const unpaidBookings = bookings.filter((b) => !b.isPaid && ["confirmed", "checked_in", "checked_out"].includes(b.status));
    const paidBookings = bookings.filter((b) => b.isPaid);
    const pendingRevenue = unpaidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const collectedRevenue = paidBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const collectedToday = paidBookings
      .filter((b) =>
        (b.paymentReceivedAt && b.paymentReceivedAt >= startOfToday && b.paymentReceivedAt < endOfToday) ||
        (b.updatedAt && b.updatedAt >= startOfToday && b.updatedAt < endOfToday && (activeBooking(b) || b.status === "checked_out"))
      )
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    // ── Services ─────────────────────────────────────────────────────
    const services = await ServiceRequest.find(hotelFilter).lean();
    const pendingServices = services.filter((s) => s.status === "pending").length;
    const activeServices = services.filter((s) => ["pending", "assigned"].includes(s.status)).length;

    // ── Recent lists for home widgets ────────────────────────────────
    const recentReservations = await Booking.find(hotelFilter)
      .populate("room hotel user")
      .sort({ createdAt: -1 })
      .limit(8);
    const recentServices = await ServiceRequest.find(hotelFilter)
      .populate("room", "roomNumber roomType")
      .populate("guest", "name username")
      .sort({ createdAt: -1 })
      .limit(6);
    const notifications = await Notification.find(hotelFilter)
      .populate("booking", "guestDisplayName checkInDate")
      .populate("room", "roomNumber")
      .sort({ isRead: 1, createdAt: -1 })
      .limit(8);
    const unreadNotifications = await Notification.countDocuments({ ...hotelFilter, isRead: false });

    res.json({
      success: true,
      summary: {
        rooms: roomCounts,
        guests: { arrivalsToday, departuresToday, inHouse, pendingCheckins, pendingCheckouts },
        payments: { pendingRevenue, collectedRevenue, collectedToday, pendingCount: unpaidBookings.length, paidCount: paidBookings.length },
        services: { pendingServices, activeServices, total: services.length },
        notifications: { unread: unreadNotifications },
      },
      reservations: recentReservations.map((b) => enrichReservation(b)),
      services: recentServices,
      notifications,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// ─── Reservation CRUD ─────────────────────────────────────────────────

export const createReservation = async (req, res) => {
  try {
    const { guestName, guestEmail, phone, hotelId, roomId, checkInDate, checkOutDate, guests, paymentMethod, notes } = req.body;
    if (!guestName || !hotelId || !roomId || !checkInDate || !checkOutDate || !guests) {
      return res.json({ success: false, message: "Missing required fields" });
    }
    if (!hotelInScope(req, hotelId)) {
      return res.json({ success: false, message: "Access denied: hotel scope violation" });
    }

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.json({ success: false, message: "Hotel not found" });
    const room = await Room.findById(roomId);
    if (!room) return res.json({ success: false, message: "Room not found" });
    if (String(room.hotel) !== String(hotelId)) {
      return res.json({ success: false, message: "Room does not belong to this hotel" });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      return res.json({ success: false, message: "Invalid dates" });
    }
    if (checkIn >= checkOut) {
      return res.json({ success: false, message: "Check-in must be before check-out" });
    }

    const overlap = await Booking.findOne({
      room: roomId,
      status: { $nin: ["cancelled", "expired"] },
      checkInDate: { $lt: checkOut },
      checkOutDate: { $gt: checkIn },
    });
    if (overlap) {
      return res.json({ success: false, message: "Room is already booked for those dates" });
    }

    // Resolve an existing guest (by email) or create a local walk-in profile.
    let userId = null;
    const email = String(guestEmail || "").trim().toLowerCase();
    if (email) {
      const existing = await User.findOne({ email });
      if (existing) userId = existing._id;
    }
    if (!userId) {
      const username = `guest_${Date.now()}`;
      const created = await User.create({
        name: String(guestName).trim(),
        username,
        email: email || `${String(guestName).trim().toLowerCase().replace(/\s+/g, ".")}@walkin.local`,
        role: "guest",
        profile: { phone: String(phone || "") },
      });
      userId = created._id;
    } else if (phone) {
      await User.updateOne({ _id: userId }, { $set: { "profile.phone": String(phone) } });
    }

    const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
    const totalPrice = nights * (room.pricePerNight || 0);
    const method = normalizePaymentMethod(paymentMethod);

    const booking = await Booking.create({
      user: String(userId),
      room: roomId,
      hotel: hotelId,
      orgId: hotel.orgId || null,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      nights,
      basePricePerNight: room.pricePerNight,
      guestDisplayName: String(guestName).trim(),
      guestEmail: email,
      totalPrice,
      guests: Number(guests),
      status: BOOKING_STATUS.CONFIRMED,
      paymentMethod: method,
      isPaid: isPaidMethod(method),
    });

    await Notification.create({
      hotel: hotelId,
      type: "new_booking",
      title: "New Reservation Created",
      message: `${booking.guestDisplayName} reserved Room ${room.roomNumber} for ${nights} night(s).${notes ? ` ${notes}` : ""}`,
      booking: booking._id,
      room: roomId,
    });

    const populated = await Booking.findById(booking._id).populate("room hotel user");
    res.json({ success: true, message: "Reservation created", reservation: enrichReservation(populated) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getReservationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate("room hotel user").lean();
    if (!booking) return res.json({ success: false, message: "Reservation not found" });
    if (!hotelInScope(req, booking.hotel)) {
      return res.json({ success: false, message: "Access denied: hotel scope violation" });
    }
    res.json({ success: true, reservation: booking });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id);
    if (!booking) return res.json({ success: false, message: "Reservation not found" });
    if (!hotelInScope(req, booking.hotel)) {
      return res.json({ success: false, message: "Access denied: hotel scope violation" });
    }
    if (!["pending", "confirmed", "reservation"].includes(booking.status)) {
      return res.json({ success: false, message: "Only pending or confirmed reservations can be edited" });
    }

    const { guestName, guestEmail, phone, roomId, checkInDate, checkOutDate, guests, paymentMethod } = req.body;
    if (guestName) booking.guestDisplayName = String(guestName).trim();
    if (guestEmail !== undefined) booking.guestEmail = String(guestEmail).trim();
    if (checkInDate) booking.checkInDate = new Date(checkInDate);
    if (checkOutDate) booking.checkOutDate = new Date(checkOutDate);
    if (guests) booking.guests = Number(guests);

    if (roomId) {
      const room = await Room.findById(roomId);
      if (!room) return res.json({ success: false, message: "Room not found" });
      if (String(room.hotel) !== String(booking.hotel)) {
        return res.json({ success: false, message: "Room does not belong to this hotel" });
      }
      const checkIn = booking.checkInDate;
      const checkOut = booking.checkOutDate;
      const overlap = await Booking.findOne({
        _id: { $ne: booking._id },
        room: roomId,
        status: { $nin: ["cancelled", "expired"] },
        checkInDate: { $lt: checkOut },
        checkOutDate: { $gt: checkIn },
      });
      if (overlap) return res.json({ success: false, message: "Room is already booked for those dates" });
      booking.room = roomId;
      booking.roomNumber = room.roomNumber;
      const nights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
      booking.nights = nights;
      booking.totalPrice = nights * (room.pricePerNight || 0);
    }

    if (paymentMethod && ["Cash", "Card", "Online", "Pay At Hotel"].includes(paymentMethod)) {
      booking.paymentMethod = paymentMethod;
      if (isPaidMethod(paymentMethod)) {
        booking.isPaid = true;
        booking.paymentReceivedAt = booking.paymentReceivedAt || new Date();
      } else {
        booking.isPaid = false;
      }
    }

    if (phone) {
      await User.updateOne({ _id: booking.user }, { $set: { "profile.phone": String(phone) } });
    }

    await booking.save();
    const updated = await Booking.findById(booking._id).populate("room hotel user");
    res.json({ success: true, message: "Reservation updated", reservation: enrichReservation(updated) });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// ─── Guest Management ─────────────────────────────────────────────────

export const getGuests = async (req, res) => {
  try {
    const { search, hotelId } = req.query;
    let hotelFilter = scopeHotelFilter(req);
    if (hotelId && hotelId !== "all") {
      if (!hotelInScope(req, hotelId)) {
        return res.json({ success: false, message: "Access denied: hotel scope violation" });
      }
      hotelFilter = { ...hotelFilter, hotel: hotelId };
    }

    const bookings = await Booking.find(hotelFilter)
      .populate("user", "name username email image profile.phone")
      .sort({ createdAt: -1 })
      .lean();

    const q = String(search || "").trim().toLowerCase();
    const map = new Map();

    for (const b of bookings) {
      const user = b.user;
      const name = (b.guestDisplayName || user?.name || user?.username || "Guest").toLowerCase();
      const email = (user?.email || b.guestEmail || "").toString().toLowerCase();
      const phone = (user?.profile?.phone || "").toString().toLowerCase();
      if (q && !name.includes(q) && !email.includes(q) && !phone.includes(q)) continue;

      const userId = user?._id ? String(user._id) : null;
      const key = userId || (email ? email : name);
      const entry = map.get(key) || {
        guestId: userId || null,
        name: b.guestDisplayName || user?.name || user?.username || "Guest",
        email: b.guestEmail || user?.email || "",
        phone: user?.profile?.phone || "",
        image: user?.image || "",
        stays: 0,
        totalSpent: 0,
        lastStay: null,
        upcomingStay: null,
        roomNumbers: new Set(),
      };

      entry.stays += 1;
      entry.totalSpent += b.totalPrice || 0;
      if (b.roomNumber) entry.roomNumbers.add(b.roomNumber);

      if (b.status === "checked_out" || b.status === "checked_in") {
        const ts = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (!entry.lastStay || ts > new Date(entry.lastStay).getTime()) {
          entry.lastStay = b.updatedAt || b.checkOutDate;
        }
      }
      if (["confirmed", "reservation"].includes(b.status)) {
        if (!entry.upcomingStay || new Date(b.checkInDate) < new Date(entry.upcomingStay)) {
          entry.upcomingStay = b.checkInDate;
        }
      }
      map.set(key, entry);
    }

    const guests = Array.from(map.values())
      .map((g) => ({ ...g, roomNumbers: Array.from(g.roomNumbers).slice(0, 5) }))
      .sort((a, b) => {
        if (q) return 0;
        const at = a.lastStay ? new Date(a.lastStay).getTime() : 0;
        const bt = b.lastStay ? new Date(b.lastStay).getTime() : 0;
        return bt - at;
      })
      .slice(0, 200);

    res.json({ success: true, guests });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getGuestDetail = async (req, res) => {
  try {
    const guestId = req.params.id;
    const hotelFilter = scopeHotelFilter(req);
    const user = await User.findById(guestId).lean();

    let bookingFilter = { ...hotelFilter };
    if (user) {
      bookingFilter.user = String(user._id);
    } else {
      bookingFilter.guestEmail = guestId;
    }

    const bookings = await Booking.find(bookingFilter)
      .populate("room", "roomNumber roomType pricePerNight")
      .populate("hotel", "name")
      .sort({ checkInDate: -1 })
      .lean();

    const serviceRequests = user
      ? await ServiceRequest.find({ ...hotelFilter, guest: String(user._id) })
          .populate("room", "roomNumber roomType")
          .sort({ createdAt: -1 })
          .limit(20)
          .lean()
      : [];

    const payments = bookings.map((b) => ({
      bookingId: b._id,
      hotel: b.hotel?.name || "Hotel",
      roomNumber: b.roomNumber || b.room?.roomNumber || "",
      amount: b.totalPrice,
      method: b.paymentMethod,
      isPaid: b.isPaid,
      status: b.status,
      date: b.paymentReceivedAt || b.updatedAt,
    }));

    res.json({
      success: true,
      guest: {
        name: user?.name || bookings[0]?.guestDisplayName || "Guest",
        email: user?.email || bookings[0]?.guestEmail || "",
        phone: user?.profile?.phone || "",
        image: user?.image || "",
        userId: user?._id || guestId,
      },
      bookings,
      serviceRequests,
      payments,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
// ─── Front Desk Check-in / Check-out ──────────────────────────────────

export const frontDeskCheckin = async (req, res) => {
  try {
    const { bookingId, documentType, documentNumber, roomId, paymentMethod } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.json({ success: false, message: "Reservation not found" });
    if (!hotelInScope(req, booking.hotel)) {
      return res.json({ success: false, message: "Access denied: hotel scope violation" });
    }
    if (!["confirmed", "reservation"].includes(booking.status)) {
      return res.json({ success: false, message: `Cannot check in a ${booking.status} reservation` });
    }

    const assignedRoom = roomId ? await Room.findById(roomId) : await Room.findById(booking.room);
    if (!assignedRoom) return res.json({ success: false, message: "Room not found" });
    if (String(assignedRoom.hotel) !== String(booking.hotel)) {
      return res.json({ success: false, message: "Room does not belong to this hotel" });
    }
    if (assignedRoom.status === "occupied" && String(booking.room) !== String(assignedRoom._id)) {
      return res.json({ success: false, message: "Selected room is currently occupied" });
    }

    // Release the previously assigned room (if the room is being changed).
    if (booking.room && String(booking.room) !== String(assignedRoom._id)) {
      await Room.updateOne({ _id: booking.room }, { $set: { status: "available", isAvailable: true } });
    }

    booking.room = assignedRoom._id;
    booking.roomNumber = assignedRoom.roomNumber;

    await transitionBookingStatus({
      booking,
      to: BOOKING_STATUS.CHECKED_IN,
      options: { actor: String(req.user._id), reason: "Front desk check-in" },
    });

    await Room.updateOne({ _id: assignedRoom._id }, { $set: { status: "occupied", isAvailable: false } });

    // Generate the key card code (4-digit) for the physical key card.
    const keyCardCode = String(Math.floor(1000 + Math.random() * 9000));

    const documents = documentType
      ? [{ type: documentType, documentNumber: documentNumber || "", verified: true }]
      : [];
    await Checkin.findOneAndUpdate(
      { booking: booking._id },
      {
        $set: {
          user: String(booking.user),
          hotel: booking.hotel,
          status: "checked_in",
          checkedInAt: new Date(),
          documents,
        },
      },
      { upsert: true }
    );

    if (paymentMethod && paymentMethod !== "unpaid" && paymentMethod !== "Pay At Hotel") {
      booking.isPaid = true;
      booking.paymentMethod = normalizePaymentMethod(paymentMethod);
      booking.paymentReceivedAt = booking.paymentReceivedAt || new Date();
      await booking.save();
    }

    await Notification.create({
      hotel: booking.hotel,
      type: "check_in",
      title: "Guest Checked In",
      message: `${booking.guestDisplayName} checked into Room ${assignedRoom.roomNumber}.${documentNumber ? ` Verified ${documentType} ${documentNumber}.` : ""}`,
      booking: booking._id,
      room: assignedRoom._id,
    });

    res.json({
      success: true,
      message: "Check-in completed",
      keyCardCode,
      booking: {
        _id: booking._id,
        guestName: booking.guestDisplayName,
        roomNumber: assignedRoom.roomNumber,
        roomType: assignedRoom.roomType,
        status: booking.status,
        isPaid: booking.isPaid,
        totalPrice: booking.totalPrice,
      },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
export const frontDeskCheckout = async (req, res) => {
  try {
    const { bookingId, extraCharges, paymentMethod, note } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.json({ success: false, message: "Reservation not found" });
    if (!hotelInScope(req, booking.hotel)) {
      return res.json({ success: false, message: "Access denied: hotel scope violation" });
    }
    if (booking.status !== "checked_in") {
      return res.json({ success: false, message: "Only checked-in guests can check out" });
    }

    const charges = Array.isArray(extraCharges)
      ? extraCharges
          .filter((c) => c && c.description && Number(c.amount) > 0)
          .map((c) => ({ description: String(c.description), amount: Number(c.amount) }))
      : [];
    const extraTotal = charges.reduce((sum, c) => sum + c.amount, 0);
    const baseTotal = booking.totalPrice || 0;
    const grandTotal = baseTotal + extraTotal;

    if (paymentMethod && paymentMethod !== "unpaid") {
      booking.isPaid = true;
      booking.paymentMethod = normalizePaymentMethod(paymentMethod);
      booking.paymentReceivedAt = booking.paymentReceivedAt || new Date();
    }

    await transitionBookingStatus({
      booking,
      to: BOOKING_STATUS.CHECKED_OUT,
      options: { actor: String(req.user._id), reason: note || "Front desk check-out" },
    });

    const room = await Room.findById(booking.room);
    if (room && String(room.hotel) === String(booking.hotel)) {
      await Room.updateOne({ _id: room._id }, { $set: { status: "cleaning", isAvailable: false } });
    }

    await Checkin.findOneAndUpdate(
      { booking: booking._id },
      { $set: { status: "checked_out", checkedOutAt: new Date() } }
    );

    await Notification.create({
      hotel: booking.hotel,
      type: "check_out",
      title: "Guest Checked Out",
      message: `${booking.guestDisplayName} checked out${room ? ` of Room ${room.roomNumber}` : ""}. Bill total ${grandTotal.toFixed(2)}.`,
      booking: booking._id,
      room: booking.room,
    });

    res.json({
      success: true,
      message: "Checkout completed",
      bill: { baseTotal, extraCharges: charges, extraTotal, grandTotal, paymentMethod: booking.paymentMethod, isPaid: booking.isPaid },
      booking: { _id: booking._id, guestName: booking.guestDisplayName, roomNumber: room?.roomNumber, status: booking.status },
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
