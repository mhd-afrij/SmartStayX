import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";


const HotelCard = ({ room, index }) => {
  const coverImage = room.images && room.images.length ? room.images[0] : assets.placeholderImage;
  return (
    <Link
      to={"/rooms/" + room._id}
      onClick={() => scrollTo(0, 0)}
      key={room._id}
      className="relative w-full rounded-xl overflow-hidden bg-white text-slate-600 border border-slate-200 shadow-sm hover:shadow-md transition"
    >
      <div className="aspect-video bg-slate-100">
        <img src={coverImage} alt={room.roomType || 'Room'} className="w-full h-full object-cover" />
      </div>

      {index % 2 === 0 && (
        <p className="px-3 py-1 absolute top-3 left-3 text-[10px] bg-white text-slate-800 font-medium rounded-full shadow-sm">
          Best Seller
        </p>
      )}

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <p className="font-playfair text-lg md:text-xl font-semibold text-slate-800">
            {room.hotel?.name || 'Hotel Name'}
          </p>
          <div className="flex items-center gap-1 text-amber-500 font-semibold">
            <img src={assets.starIconFilled} alt="rating" className="w-4 h-4" />
            <span className="text-sm">4.5</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <img src={assets.locationFilledIcon} alt="location" className="w-4 h-4" />
          <span className="text-slate-700 truncate">{room.hotel?.address || 'Location'}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-lg md:text-xl font-bold text-slate-900">
            ${room.pricePerNight}
            <span className="ml-1 text-xs text-slate-500 font-normal">/night</span>
          </p>
          <button
            className="px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700"
          >
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;
