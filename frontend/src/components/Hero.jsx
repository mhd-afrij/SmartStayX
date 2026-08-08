/**
 * Hero — Full-screen landing hero with rotating background gallery,
 * scroll-driven 3D parallax, and a search-form card for bookings.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cities } from '../assets/assets'
import { useAppContext } from '../context/AppContext'

/** High‑resolution hero background images (Unsplash) */
const HERO_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920',
  'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920',
  'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920',
  'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920',
]

/** Staggered entry animation for hero text blocks */
const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 30 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: 'easeOut' },
  }),
}

const Hero = () => {
  const { navigate } = useAppContext()
  const sectionRef = useRef(null)

  // --- Search form state ---
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState('2')

  // --- Background image rotation ---
  const [currentIndex, setCurrentIndex] = useState(0)
  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % HERO_IMAGES.length)
  }, [])
  useEffect(() => {
    const timer = setInterval(nextImage, 6000)
    return () => clearInterval(timer)
  }, [nextImage])

  // --- Scroll‑driven 3D parallax transforms ---
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.15])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '40%'])
  const contentRotateX = useTransform(scrollYProgress, [0, 1], [0, 12])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])
  const overlayOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  /** Build query params from search fields and navigate to /rooms */
  const handleSearch = (event) => {
    event.preventDefault()
    const target = destination.trim()
    const params = new URLSearchParams()
    if (target) params.set('destination', target)
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    if (guests) params.set('guests', guests)
    navigate(target ? `/rooms?${params.toString()}` : '/rooms')
  }

  return (
    <section
      ref={sectionRef}
      className="luxury-shell relative isolate min-h-screen overflow-hidden pt-28 pb-12 flex items-center md:pt-32 md:pb-16"
      style={{ perspective: '1200px' }}
    >
      {/* ---- Background layer (scroll parallax, deepest) ---- */}
      <div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
        <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              aria-hidden="true"
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.15 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.4, ease: 'easeInOut' }}
            >
              <motion.div
                className="h-full w-full"
                initial={{ scale: 1 }}
                animate={{ scale: 1.08 }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
              >
                <img
                  src={HERO_IMAGES[currentIndex]}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ---- Image pagination dots ---- */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? 'w-8 bg-[#2563EB]' : 'w-1.5 bg-white/50 hover:bg-white/80'
            }`}
          />
        ))}
      </div>

      {/* ---- Gradient overlay (scroll fade) ---- */}
      <motion.div
        className="absolute inset-0"
        style={{
          opacity: overlayOpacity,
          backgroundImage:
            'linear-gradient(180deg,rgba(7,17,31,0.25) 0%,rgba(7,17,31,0.55) 40%,rgba(7,17,31,0.92) 100%)',
        }}
      />

      {/* ---- Foreground content (3D scroll lift, closest layer) ---- */}
      <motion.div
        style={{
          y: contentY,
          rotateX: contentRotateX,
          opacity: contentOpacity,
          transformStyle: 'preserve-3d',
        }}
        className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-12"
      >
        {/* ---- Hero copy ---- */}
        <motion.div
          variants={STAGGER_ITEM}
          initial="hidden"
          animate="visible"
          custom={0.05}
          className="max-w-2xl lg:self-center"
        >
          <div className="luxury-kicker inline-flex items-center gap-4 rounded-full border border-white/25 bg-white/15 px-4 py-2 text-white">
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-[#2563EB] to-transparent" />
            The Ultimate Hotel Experience
          </div>

          <h1 className="font-playfair mt-7 max-w-4xl text-[clamp(3rem,7vw,6.2rem)] leading-[0.95] tracking-[-0.05em] text-white">
            Discover Your Perfect{' '}
            <span className="text-[#F5D08A]">Gateway</span> Destination
          </h1>

          <p className="luxury-copy mt-6 max-w-2xl text-[1.02rem] md:text-[1.08rem]">
            Browse handpicked resorts, cinematic city escapes, and private
            sanctuaries designed for travelers who expect calm, comfort, and a
            little ceremony in every arrival.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link to="/rooms" className="gold-button px-7 py-4 text-sm">
              Explore Stays
              <ArrowRight className="w-4" />
            </Link>
          </div>
        </motion.div>

        {/* ---- Search-form card ---- */}
        <motion.div
          variants={STAGGER_ITEM}
          initial="hidden"
          animate="visible"
          custom={0.2}
          className="relative lg:self-center"
        >
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="luxury-card relative overflow-hidden p-4 md:p-6 shadow-[0_20px_60px_rgba(15,23,42,0.1)]"
          >
            <form onSubmit={handleSearch} className="relative space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.45fr_1fr_1fr_0.9fr]">
                <label className="space-y-2">
                  <span className="luxury-kicker">Destination</span>
                  <select
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="luxury-select"
                  >
                    <option value="">
                      Where are you going?
                    </option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="luxury-kicker">Check-in</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="luxury-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="luxury-kicker">Check-out</span>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="luxury-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="luxury-kicker">Guests</span>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="luxury-select"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} Guest{n > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="gold-button mt-2 w-full px-6 py-4 text-sm uppercase tracking-[0.22em]"
              >
                <Search className="w-4" />
                Search Luxury Stays
              </button>
            </form>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Hero
