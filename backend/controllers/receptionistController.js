import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import ServiceRequest from "../models/ServiceRequest.js";
import Offer from "../models/Offer.js";
import Review from "../models/Review.js";
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

    const enriched = bookings.map((b) => ({
      _id: b._id,
      guestName: b.guestDisplayName || b.user?.name || b.user?.username || "Guest",
      guestEmail: b.guestEmail || b.user?.email || "",
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
    }));

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
    const allowed = ["checked_in", "checked_out", "cancelled"];

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
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.json({ success: false, message: "Booking not found" });
    }

    if (!assertHotelScope(req, res, booking.hotel)) return;

    booking.isPaid = true;
    booking.paymentMethod = "Pay At Hotel";
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
