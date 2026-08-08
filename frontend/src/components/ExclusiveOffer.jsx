/**
 * ExclusiveOffer — Dynamic grid of limited‑time offer cards with discount badges,
 * expiry dates, and 3D mouse‑track tilt. Shows skeleton placeholders while loading.
 */
import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import Title from './Title'
import { useAppContext } from '../context/AppContext'
import TiltCard from './TiltCard'

/** Format an expiry value to a short human‑readable string */
const formatExpiry = (value) => {
  if (!value) return 'Limited time'
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const ExclusiveOffer = () => {
  const { offers } = useAppContext()
  const offerList = useMemo(() => offers || [], [offers])

  return (
    <section className="luxury-section">
      <div className="mx-auto max-w-7xl">
        {/* Header row */}
        <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-10">
          <Title
            align="left"
            kicker="Limited Edition"
            title="Exclusive Offers"
            subtitle="Take advantage of our limited-time offers and special packages to enhance your stay and create unforgettable memories."
          />
          <Link
            to="/rooms"
            className="ghost-button px-6 py-3 text-sm uppercase tracking-[0.18em] flex-shrink-0"
          >
            View All Offers
            <ArrowRight className="w-3.5" />
          </Link>
        </div>

        {/* Offer cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offerList.length === 0 ? (
            <>
              {/* Skeleton placeholders */}
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="flex flex-col justify-end overflow-hidden rounded-[28px] border border-black/[0.06] min-h-[22rem] bg-white animate-pulse"
                >
                  <div className="p-6 md:p-7 space-y-3">
                    <div className="h-6 w-1/2 rounded bg-[#f4f2ef]" />
                    <div className="h-4 w-3/4 rounded bg-[#f4f2ef]" />
                    <div className="h-3 w-1/3 rounded bg-[#f4f2ef]" />
                    <div className="h-4 w-1/4 rounded bg-[#f4f2ef] mt-4" />
                  </div>
                </div>
              ))}
              <div className="lg:col-span-3 flex items-center justify-center py-6">
                <p className="text-sm text-slate-400">
                  No active offers — check back soon for exclusive packages.
                </p>
              </div>
            </>
          ) : (
            offerList.map((item, index) => {
              const roomId = item.room?._id || item.room
              const ctaHref = roomId ? `/rooms/${roomId}` : '/rooms'
              const image =
                item.image ||
                item.imageUrl ||
                item.fallbackImage ||
                item.imageLink

              return (
                <motion.div
                  key={item._id || item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                >
                  <TiltCard
                    maxTilt={4}
                    className="group relative flex flex-col justify-end overflow-hidden rounded-[28px] border border-black/[0.06] min-h-[22rem]"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={item.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-[#f4f2ef]" />
                    )}

                    {/* Bottom gradient overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.02)_0%,rgba(7,17,31,0.72)_56%,rgba(7,17,31,0.96)_100%)]" />

                    {/* Discount badge */}
                    <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-[#F5D08A] backdrop-blur-xl font-semibold">
                      {item.discountPercent ?? item.priceOff}% OFF
                    </div>

                    {/* Card body */}
                    <div className="relative p-6 md:p-7">
                      <p className="font-playfair text-2xl text-white md:text-3xl">
                        {item.title}
                      </p>
                      <p className="mt-2 text-sm text-white/70">
                        {item.description}
                      </p>
                      <p className="mt-2 text-xs text-white/50">
                        Expires {formatExpiry(item.expiryDate)}
                      </p>

                      <Link
                        to={ctaHref}
                        onClick={() => window.scrollTo(0, 0)}
                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#F5D08A] transition-all hover:gap-3"
                      >
                        Book this room
                        <ArrowRight className="w-3.5" />
                      </Link>
                    </div>
                  </TiltCard>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </section>
  )
}

export default ExclusiveOffer
