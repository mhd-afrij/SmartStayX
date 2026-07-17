/**
 * HotelCard — Individual room card used inside the FeaturedDestination carousel.
 * Wraps the link and room details in a 3D tilt container.
 */
import React from 'react'
import { Star, MapPin } from 'lucide-react'
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
            <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-[#D4A85F]/90 px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-[#1b1d20] backdrop-blur-xl">
              Best Seller
            </div>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-playfair text-base text-white leading-tight line-clamp-2">
              {room.hotel?.name || 'Hotel Name'}
            </h3>
            <div className="flex items-center gap-1 text-[#F5D08A] font-semibold flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#F5D08A]" />
              <span className="text-sm">4.5</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-white/50">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">
              {room.hotel?.address || 'Location'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-white/8 mt-auto">
            <div className="text-lg font-semibold text-white">
              {formatPrice(room.pricePerNight)}
              <span className="ml-1 text-xs text-white/40 font-normal">
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
