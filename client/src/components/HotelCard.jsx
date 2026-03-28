import React from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";


const HotelCard = ({ room, index }) => {
  const { formatPrice } = useAppContext();
  const coverImage = room.images && room.images.length ? room.images[0] : assets.placeholderImage;
  return (
    <Link
      to={"/rooms/" + room._id}
      onClick={() => scrollTo(0, 0)}
      key={room._id}
      className="block rounded-xl overflow-hidden bg-white text-slate-600 border border-slate-200 shadow-sm hover:shadow-xl transition duration-300 h-full flex flex-col"
    >
      <div className="aspect-video bg-slate-100 overflow-hidden">
        <img src={coverImage} alt={room.roomType || 'Room'} className="w-full h-full object-cover hover:scale-105 transition duration-300" />
      </div>

      {index % 2 === 0 && (
        <p className="px-3 py-1 absolute top-3 left-3 text-[10px] bg-white text-slate-800 font-medium rounded-full shadow-sm">
          Best Seller
        </p>
      )}

      <div className="p-4 space-y-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <h3 className="font-playfair text-base font-semibold text-slate-800 line-clamp-2">
            {room.hotel?.name || 'Hotel Name'}
          </h3>
          <div className="flex items-center gap-0.5 text-amber-500 font-semibold flex-shrink-0 ml-2">
            <img src={assets.starIconFilled} alt="rating" className="w-3 h-3" />
            <span className="text-xs">4.5</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-600">
          <img src={assets.locationFilledIcon} alt="location" className="w-3 h-3 flex-shrink-0" />
          <span className="line-clamp-1">{room.hotel?.address || 'Location'}</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
          <div className="text-base font-bold text-slate-900">
            {formatPrice(room.pricePerNight)}
            <span className="ml-0.5 text-xs text-slate-500 font-normal">/night</span>
          </div>
          <button
            onClick={(e) => e.preventDefault()}
            className="px-3 py-1.5 text-xs font-medium border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-700 transition whitespace-nowrap"
          >
            Book Now
          </button>
        </div>
      </div>
    </Link>
  );
};

export default HotelCard;
