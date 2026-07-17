/**
 * StatsSection — Achievement counters (properties, guests, rating, destinations)
 * with a 3D scroll‑reveal animation driven by framer‑motion's useScroll.
 */
import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/** Platform metrics displayed as animated counters */
const STATS = [
  { value: '500+', label: 'Luxury Properties' },
  { value: '10K+', label: 'Happy Guests' },
  { value: '4.9', label: 'Average Rating' },
  { value: '50+', label: 'Destinations' },
]

const StatsSection = () => {
  const sectionRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  // 3D perspective resolves as the section scrolls into view
  const cardRotateX = useTransform(scrollYProgress, [0, 0.5], [8, 0])
  const cardY = useTransform(scrollYProgress, [0, 0.5], [60, 0])
  const cardOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1])

  return (
    <section
      ref={sectionRef}
      className="luxury-section pt-0"
      style={{ perspective: '1000px' }}
    >
      <div className="mx-auto max-w-7xl">
        <motion.div
          style={{
            rotateX: cardRotateX,
            y: cardY,
            opacity: cardOpacity,
            transformStyle: 'preserve-3d',
          }}
          className="luxury-card relative overflow-hidden px-6 py-12 md:py-16"
        >
          {/* Subtle gold radial glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,168,95,0.08),transparent_50%)]" />

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-playfair text-4xl md:text-5xl text-[#F5D08A]">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-sm uppercase tracking-[0.18em] text-white/50">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default StatsSection
