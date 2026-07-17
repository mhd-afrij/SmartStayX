/**
 * SocialWall — 8‑image masonry grid acting as a user‑generated content showcase
 * ("Guest Moments"), with 3D tilt on each tile and hover‑revealed overlays.
 */
import React from 'react'
import { motion } from 'framer-motion'
import Title from './Title'
import TiltCard from './TiltCard'
import popularDestinations from '../data/popularDestinations'

const SocialWall = () => {
  const images = popularDestinations.slice(0, 8)

  return (
    <section className="luxury-section">
      <div className="mx-auto max-w-7xl space-y-8">
        <Title
          kicker="@SmartStayX"
          title="Guest Moments"
          subtitle="Real stays, real memories — shared by our community around the world."
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {images.map((dest, i) => (
            <motion.div
              key={dest.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className={i === 0 ? 'md:col-span-2 md:row-span-2' : ''}
            >
              <TiltCard
                maxTilt={4}
                className="group relative overflow-hidden rounded-[16px] border border-white/10 h-full"
              >
                <img
                  src={dest.image}
                  alt={dest.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient overlay + destination label on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-sm font-playfair text-white">
                    {dest.name}
                  </p>
                  <p className="text-xs text-white/60">{dest.temp}</p>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default SocialWall
