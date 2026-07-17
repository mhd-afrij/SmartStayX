// roomAssignmentController.js — Auto room assignment by preferences
import roomAssignmentService from "../services/roomAssignmentService.js";

export const getBestRoom = async (req, res) => {
  try {
    const { hotelId, checkInDate, checkOutDate, guests, preferredRoomType } = req.query;
    const room = await roomAssignmentService.findBestRoom({
      hotelId,
      checkInDate,
      checkOutDate,
      guests: Number(guests) || 1,
      userId: req.user?._id,
      preferredRoomType,
    });

    if (!room) return res.json({ success: false, message: "No suitable room available" });
    res.json({ success: true, room });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const autoAssignRoom = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const result = await roomAssignmentService.assignRoom(bookingId, req.user._id);
    res.json({ success: true, message: "Room auto-assigned", ...result });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
