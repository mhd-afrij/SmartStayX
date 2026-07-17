/**
 * AIPlannerSection — Two‑column layout featuring an AI trip planner prompt panel
 * (suggestion chips, action buttons) next to a randomised itinerary preview card.
 * The left card animates with a 3D scroll‑reveal effect.
 */
import React, { useMemo, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Title from './Title'
import { useAppContext } from '../context/AppContext'
import popularDestinations from '../data/popularDestinations'

/** Quick‑prompt suggestion chips shown below the title */
const SUGGESTIONS = [
  'Best month to go',
  'Private airport transfer',
  'Sunset suite',
  'Wellness retreat',
]

const AIPlannerSection = () => {
  const { navigate } = useAppContext()
  const sectionRef = useRef(null)

  // --- 3D scroll reveal for the left card ---
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const cardRotateX = useTransform(scrollYProgress, [0, 0.4], [6, 0])
  const cardY = useTransform(scrollYProgress, [0, 0.4], [40, 0])

  // Pick one random destination on mount for the preview card
  const previewDest = useMemo(() => {
    const idx = Math.floor(Math.random() * popularDestinations.length)
    return popularDestinations[idx]
  }, [])

  return (
    <section
      ref={sectionRef}
      id="ai-planner"
      className="luxury-section"
      style={{ perspective: '1000px' }}
    >
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        {/* ---- Left panel — prompt + suggestions + CTAs ---- */}
        <motion.div
          style={{
            rotateX: cardRotateX,
            y: cardY,
            transformStyle: 'preserve-3d',
          }}
          className="luxury-card relative overflow-hidden p-6 md:p-8"
        >
          <Title
            align="left"
            kicker="AI Trip Planner"
            title="Shape a quieter, more curated itinerary in minutes"
            subtitle="Use the planner to build a trip around mood, season, and pace instead of just dates and rooms."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {SUGGESTIONS.map((item) => (
              <div
                key={item}
                className="luxury-card-soft px-4 py-4 text-sm text-white/82"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button
              onClick={() => navigate('/itinerary')}
              className="gold-button px-6 py-4 text-sm"
            >
              Open Trip Planner
            </button>
            <button
              onClick={() => navigate('/rooms')}
              className="ghost-button px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]"
            >
              Explore Hotels
            </button>
          </div>
        </motion.div>

        {/* ---- Right panel — randomised itinerary preview ---- */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
          className="luxury-card-soft relative overflow-hidden p-6 md:p-8"
        >
          {/* Gold + white radial glows */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,168,95,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_26%)]" />

          <div className="relative space-y-4">
            <p className="font-space text-xs uppercase tracking-[0.24em] text-white/50">
              Preview
            </p>
            <p className="font-playfair text-3xl text-white">
              3 nights in {previewDest.name}
            </p>

            <div className="space-y-3 text-sm text-white/70">
              {[
                { label: `${previewDest.name} stay`, value: '2 nights' },
                { label: 'Wellness spa afternoon', value: 'Included' },
                { label: 'Private transfer', value: 'Premium' },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
                >
                  <span>{row.label}</span>
                  <span className="text-[#F5D08A]">{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default AIPlannerSection
