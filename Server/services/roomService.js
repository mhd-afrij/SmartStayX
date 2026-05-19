import Room from '../models/Room.js';
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import logger from '../utils/logger.js';
import getRedis from '../utils/redisClient.js';
import { BOOKING_STATUS } from '../constants/bookingStatuses.js';

const CACHE_TTL = 60;
const TRENDING_CACHE_KEY = 'rooms:trending';
const TRENDING_CACHE_TTL = 300; // 5 min

const buildCacheKey = (page, limit, filter) =>
  `rooms:page:${page}:limit:${limit}:f:${JSON.stringify(filter || {})}`;

const getRooms = async ({ page = 1, limit = 10, filter = {} } = {}) => {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.min(100, Math.max(1, Number(limit) || 10));
  const cacheKey = buildCacheKey(p, l, filter);

  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.info('rooms: cache hit %s', cacheKey);
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn('redis get failed: %o', err.message);
    }
  }

  const skip = (p - 1) * l;
  const query = { isAvailable: true, ...filter };

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
    try {
      await redis.set(cacheKey, JSON.stringify(result), 'EX', CACHE_TTL);
    } catch (err) {
      logger.warn('redis set failed: %o', err.message);
    }
  }

  return result;
};

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

const toggleAvailability = async ({ roomId, userId }) => {
  const room = await Room.findById(roomId).populate('hotel');
  if (!room) throw Object.assign(new Error('Room not found'), { status: 404 });
  if (String(room.hotel.owner) !== String(userId)) {
    throw Object.assign(new Error('Not authorized'), { status: 403 });
  }

  room.isAvailable = !room.isAvailable;
  await room.save();

  const redis = getRedis();
  if (redis) {
    try {
      const keys = await redis.keys('rooms:page:*');
      if (keys.length > 0) await redis.del(...keys);
    } catch (err) {
      logger.warn('redis cache invalidation failed: %o', err.message);
    }
  }

  return room;
};

// ── Trending rooms (most booked in last 30 days) ──
const getTrendingRooms = async ({ limit = 10 } = {}) => {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(TRENDING_CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      logger.warn('redis trending get failed: %o', err.message);
    }
  }

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

  if (redis) {
    try {
      await redis.set(TRENDING_CACHE_KEY, JSON.stringify(trending), 'EX', TRENDING_CACHE_TTL);
    } catch (err) {
      logger.warn('redis trending set failed: %o', err.message);
    }
  }

  return trending;
};

// ── Cache warming: pre-populate first page on startup ──
const warmCache = async () => {
  const redis = getRedis();
  if (!redis) return;

  try {
    const firstPage = await getRooms({ page: 1, limit: 10 });
    const trending = await getTrendingRooms({ limit: 10 });
    logger.info('room cache warmed: %d rooms, %d trending', firstPage.rooms.length, trending.length);
  } catch (err) {
    logger.warn('cache warm failed: %o', err.message);
  }
};

export default { getRooms, getOwnerRooms, toggleAvailability, getTrendingRooms, warmCache };
