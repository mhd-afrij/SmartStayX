/**
 * ExperienceShowcase — Horizontally scrollable row of five experience‑category
 * cards (Beach, Mountain, Spa, City, Adventure) with 3D mouse‑track tilt.
 */
import React from 'react'
import { ArrowRight } from 'lucide-react'
import Title from './Title'
import { useAppContext } from '../context/AppContext'
import TiltCard from './TiltCard'

/** Category data — title + hero image (Unsplash) */
const EXPERIENCES = [
  {
    title: 'Beach Resorts',
    image:
      'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Mountain Retreats',
    image:
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Wellness Spas',
    image:
      'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'City Luxury',
    image:
      'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?q=80&w=1200&auto=format&fit=crop',
  },
  {
    title: 'Adventure Trips',
    image:
      'https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=1200&auto=format&fit=crop',
  },
]

const ExperienceShowcase = () => {
  const { navigate } = useAppContext()

  return (
    <section id="experiences" className="luxury-section">
      <div className="mx-auto max-w-7xl space-y-8">
        <Title
          align="left"
          kicker="Experience categories"
          title="Immersive categories designed like a private travel reel"
          subtitle="Move through broad moods rather than a generic hotel grid, with each card carrying its own visual pace and tone."
        />

        <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
          {EXPERIENCES.map((experience, index) => (
            <TiltCard
              key={experience.title}
              maxTilt={5}
              className={`relative min-w-[18rem] flex-1 overflow-hidden rounded-[28px] border border-black/[0.06] shadow-[0_20px_60px_rgba(15,23,42,0.08)] ${
                index === 0 ? 'h-[26rem]' : 'h-[22rem]'
              }`}
            >
              <img
                src={experience.image}
                alt={experience.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-110"
              />

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.05)_0%,rgba(7,17,31,0.7)_58%,rgba(7,17,31,0.92)_100%)]" />

              {/* Curated badge */}
              <div className="absolute left-5 top-5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/90 backdrop-blur-xl">
                Curated moment
              </div>

              {/* Bottom content */}
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-playfair text-3xl text-white">
                  {experience.title}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/80">
                  Luxury that shifts with the rhythm of your trip.
                </p>
                <button
                  onClick={() => navigate('/rooms')}
                  className="mt-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#F5D08A] transition-all hover:gap-3"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-4" />
                </button>
              </div>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  )
}

export default ExperienceShowcase
