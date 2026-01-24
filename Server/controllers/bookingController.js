import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js"; // Assuming you have a Hotel model

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

    // Get totalPrice from room
    const roomData = await Room.findById(room).populate("hotel");
    let totalPrice = roomData.pricePerNight;

    // Calculate totalPrice based on nights
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const timeDiff = checkOut.getTime() - checkIn.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));

    totalPrice *= nights;
    const booking = await Booking.create({
      user,
      room,
      hotel: roomData.hotel._id,
      guests: +guests,
      checkInDate,
      checkOutDate,
      totalPrice,
    });
    res.json({ success: true, message: "Booking created successfully" });
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

// API to get all bookings for a hotel
// GET /api/bookings/hotel
export const getHotelBookings = async (req, res) => {
  try {
    const auth = typeof req.auth === "function" ? req.auth() : req.auth;
    const userId = auth?.userId;
    const hotel = await Hotel.findOne({ owner: userId });
    if (!hotel) {
      return res.json({ success: false, message: "No hotel found" });
    }

    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room hotel user")
      .sort({ createdAt: -1 });

    const rooms = await Room.find({ hotel: hotel._id });
    const totalRooms = rooms.length || 0;
    const now = new Date();

    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((acc, b) => acc + (b.totalPrice || 0), 0);

    const activeStays = bookings.filter(
      (b) => new Date(b.checkInDate) <= now && new Date(b.checkOutDate) >= now && b.status !== "cancelled"
    ).length;
    const occupancyPercent = totalRooms ? Math.round((activeStays / totalRooms) * 100) : 0;

    const revenueToday = bookings
      .filter((b) => {
        const d = new Date(b.createdAt);
        return d.toDateString() === now.toDateString();
      })
      .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

    const revenueWeek = bookings
      .filter((b) => now - new Date(b.createdAt) <= 7 * 24 * 60 * 60 * 1000)
      .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

    const revenueMonth = bookings
      .filter((b) => now - new Date(b.createdAt) <= 30 * 24 * 60 * 60 * 1000)
      .reduce((acc, b) => acc + (b.totalPrice || 0), 0);

    const upcomingBookings = bookings.filter((b) => new Date(b.checkInDate) > now && b.status !== "cancelled").length;
    const cancelledBookings = bookings.filter((b) => b.status === "cancelled").length;
    const lastMinuteBookings = bookings.filter((b) => {
      const created = new Date(b.createdAt);
      const checkIn = new Date(b.checkInDate);
      const hoursDiff = (checkIn - created) / (1000 * 60 * 60);
      return hoursDiff > 0 && hoursDiff <= 48;
    }).length;

    // Trends for last 7 days
    const trends = Array.from({ length: 7 }).map((_, idx) => {
      const day = new Date();
      day.setDate(now.getDate() - (6 - idx));
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      const bookingsCount = bookings.filter((b) => {
        const d = new Date(b.createdAt);
        return d.toDateString() === day.toDateString();
      }).length;
      return { label, bookings: bookingsCount };
    });

    res.json({
      success: true,
      dashboardData: {
        totalBookings,
        totalRevenue,
        occupancyPercent,
        revenue: { today: revenueToday, week: revenueWeek, month: revenueMonth },
        avgRating: null,
        upcomingBookings,
        cancelledBookings,
        lastMinuteBookings,
        bookings,
        rooms,
        trends,
      },
    });
  } catch (error) {
    res.json({ success: false, message: "Failed to fetch bookings" });
  }
};
