// roomService.js — Business logic for room search, filtering, and recommendation
import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';
import { getRedis } from '../configs/redis.js';

const cityPrefix = (city) =>
  city
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.slice(0, 1).toUpperCase())
    .join('')
    .slice(0, 3) || 'CTY';

const typePrefix = (roomType) =>
  roomType
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .split(/\s+/)
    .map((w) => w.slice(0, 1).toUpperCase())
    .join('')
    .slice(0, 3) || 'STM';

// Retrieves a paginated, filtered list of available rooms
const getRooms = async ({ page = 1, limit = 10, filter = {} } = {}) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (p - 1) * l;
  const query = { isAvailable: true, ...filter };
  const redis = getRedis();
  const cacheKey = `rooms:list:${JSON.stringify({ p, l, query })}`;

  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  }

  // Fetch rooms and total count in parallel
  const [rooms, total] = await Promise.all([
    Room.find(query).populate('hotel').sort({ createdAt: -1 }).skip(skip).limit(l),
    Room.countDocuments(query),
  ]);

  const hydratedRooms = rooms.map((room) => {
    const plain = room.toObject();
    const hotel = plain.hotel || {};
    return {
      ...plain,
      hotelName: plain.hotelName || hotel.name || '',
      hotelAddress: plain.hotelAddress || hotel.address || '',
      hotelCity: plain.hotelCity || hotel.city || '',
    };
  });

  const result = { rooms: hydratedRooms, page: p, limit: l, total };

  if (redis) {
    await redis.set(cacheKey, JSON.stringify(result), 'EX', 60);
  }

  return result;
};

// Retrieves all rooms belonging to hotels owned by the given user
const getOwnerRooms = async ({ userId }) => {
  const hotels = await Hotel.find({ owner: userId }).select('_id');
  const hotelIds = hotels.map((h) => h._id);
  if (hotelIds.length === 0) return [];

  const rooms = await Room.find({ hotel: { $in: hotelIds } }).populate('hotel');
  return rooms.map((room) => {
    const plain = room.toObject();
    const hotel = plain.hotel || {};
    return {
      ...plain,
      hotelName: plain.hotelName || hotel.name || '',
      hotelAddress: plain.hotelAddress || hotel.address || '',
      hotelCity: plain.hotelCity || hotel.city || '',
    };
  });
};

// Toggles a room's isAvailable flag; only the owning Admin can perform this
const toggleAvailability = async ({ roomId, userId }) => {
  if (typeof roomId !== 'string') throw Object.assign(new Error('Invalid room ID'), { status: 400 });
  const room = await Room.findById(roomId).populate('hotel');
  if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
  if (String(room.hotel.owner) !== String(userId)) {
    throw Object.assign(new Error('Not authorized'), { status: 403 });
  }

  // Toggle the flag and persist
  room.isAvailable = !room.isAvailable;
  await room.save();

  const redis = getRedis();
  if (redis) {
    const keys = await redis.keys('rooms:list:*');
    if (keys.length > 0) {
      await redis.del(keys);
    }
  }

  return room;
};

// ── Trending rooms — aggregate booking count in the last 30 days, sorted desc ──
// Returns the most-booked rooms in the last 30 days, sorted by booking count
const getTrendingRooms = async ({ limit = 10 } = {}) => {
  // Aggregate booking counts per room over the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const trending = await Booking.aggregate([
    {
      $match: {
        createdAt: { $gte: thirtyDaysAgo },
        status: { $nin: [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED] },
      },
    },
    { $group: { _id: '$room', bookingCount: { $sum: 1 } } },
    { $sort: { bookingCount: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'rooms',
        localField: '_id',
        foreignField: '_id',
        as: 'room',
      },
    },
    { $unwind: '$room' },
    {
      $lookup: {
        from: 'hotels',
        localField: 'room.hotel',
        foreignField: '_id',
        as: 'hotel',
      },
    },
    { $unwind: { path: '$hotel', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        _id: '$room._id',
        roomNumber: '$room.roomNumber',
        roomType: '$room.roomType',
        pricePerNight: '$room.pricePerNight',
        amenities: '$room.amenities',
        images: '$room.images',
        hotelName: { $ifNull: ['$room.hotelName', '$hotel.name', ''] },
        hotelAddress: { $ifNull: ['$room.hotelAddress', '$hotel.address', ''] },
        hotelCity: { $ifNull: ['$room.hotelCity', '$hotel.city', ''] },
        bookingCount: 1,
      },
    },
  ]);

  return trending;
};

// Suggests the next room number for a hotel based on city prefix and room type
const suggestNextRoomNumber = async ({ hotelId, roomType }) => {
  const hotel = await Hotel.findById(hotelId).select('city');
  if (!hotel) throw Object.assign(new Error('Hotel not found'), { status: 404 });

  const cPrefix = cityPrefix(hotel.city);
  const tPrefix = roomType ? typePrefix(roomType) : '';
  const prefix = tPrefix ? `${cPrefix}-${tPrefix}` : cPrefix;
  const regex = tPrefix ? `^${cPrefix}-${tPrefix}-\\d+$` : `^${cPrefix}-\\d+$`;
  const rooms = await Room.find({ hotel: hotelId, roomNumber: { $regex: regex } }).select('roomNumber');
  let maxNum = 0;
  rooms.forEach((r) => {
    const match = r.roomNumber.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });
  return `${prefix}-${String(maxNum + 1).padStart(3, '0')}`;
};

export default { getRooms, getOwnerRooms, toggleAvailability, getTrendingRooms, suggestNextRoomNumber };
