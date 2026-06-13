// HotelCard — Reusable hotel/room card with image, rating, location, and price
import React from "react";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const HotelCard = ({ room, index }) => {
  const { formatPrice } = useAppContext();
  const coverImage = room.images && room.images.length ? room.images[0] : assets.placeholderImage;

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.24 }}
    >
      <Link
        to={"/rooms/" + room._id}
        onClick={() => scrollTo(0, 0)}
        className="luxury-card group block overflow-hidden"
        style={{ textDecoration: 'none', height: '100%', display: 'flex', flexDirection: 'column' }}
      >
        {/* Image Container */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <img
            src={coverImage}
            alt={room.roomType || 'Room'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Badge */}
          {index % 2 === 0 && (
            <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-[#D4A85F]/90 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[#1b1d20] backdrop-blur-xl">
              Best Seller
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-playfair text-base text-white leading-tight line-clamp-2">
              {room.hotel?.name || 'Hotel Name'}
            </h3>
            <div className="flex items-center gap-1 text-[#F5D08A] font-semibold flex-shrink-0">
              <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm">4.5</span>
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-white/50">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">{room.hotel?.address || 'Location'}</span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-auto">
            <div className="text-lg font-semibold text-white">
              {formatPrice(room.pricePerNight)}
              <span className="ml-1 text-xs text-white/40 font-normal">/night</span>
            </div>
            <span className="gold-button px-4 py-2 text-[0.65rem] uppercase tracking-[0.18em] cursor-pointer">
              Book Now
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default HotelCard;
