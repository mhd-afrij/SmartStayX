/**
 * HotelCard — Individual room card used inside the FeaturedDestination carousel.
 * Wraps the link and room details in a 3D tilt container.
 */
import React from 'react'
import { MapPin } from 'lucide-react'
import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import TiltCard from './TiltCard'

const HotelCard = ({ room, index }) => {
  const { formatPrice } = useAppContext()
  const coverImage =
    room.images && room.images.length
      ? room.images[0]
      : assets.placeholderImage

  return (
    <TiltCard maxTilt={4} className="h-full">
      <Link
        to={`/rooms/${room._id}`}
        onClick={() => scrollTo(0, 0)}
        className="luxury-card group block overflow-hidden"
        style={{
          textDecoration: 'none',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Cover image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3' }}>
          <img
            src={coverImage}
            alt={room.roomType || 'Room'}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {index % 2 === 0 && (
            <div className="absolute left-3 top-3 rounded-full border border-black/[0.06] bg-[#2563EB] px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-white">
              Best Seller
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="font-playfair text-base text-slate-900 leading-tight line-clamp-2">
            {room.hotel?.name || 'Hotel Name'}
          </h3>

          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">
              {room.hotel?.address || 'Location'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/[0.06] mt-auto">
            <div className="text-lg font-semibold text-slate-900">
              {formatPrice(room.pricePerNight)}
              <span className="ml-1 text-xs text-slate-400 font-normal">
                /night
              </span>
            </div>
            <span className="gold-button px-4 py-2 text-[0.65rem] uppercase tracking-[0.18em] cursor-pointer">
              Book Now
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  )
}

export default HotelCard
