/**
 * PopularDestinations — Masonry grid of 9 destination cards with 3D mouse‑track tilt,
 * hover‑revealed CTAs, and click navigation to the blog filtered by destination name.
 */
import React from 'react'
import { ArrowRight } from 'lucide-react'
import Title from './Title'
import { useAppContext } from '../context/AppContext'
import popularDestinations from '../data/popularDestinations'
import TiltCard from './TiltCard'

/** Per‑item grid spans for the masonry layout (xl breakpoint) */
const GRID_SPANS = [
  'xl:col-span-7 xl:row-span-2',
  'xl:col-span-5',
  'xl:col-span-5',
  'xl:col-span-4 xl:row-span-2',
  'xl:col-span-8',
  'xl:col-span-4',
  'xl:col-span-4',
  'xl:col-span-4',
  'xl:col-span-12',
]

const PopularDestinations = () => {
  const { navigate } = useAppContext()

  return (
    <section id="popular-destinations" className="luxury-section">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8">
          <Title
            align="left"
            kicker="Popular Destinations"
            title="A gallery of places chosen for atmosphere, not noise"
            subtitle="Each destination is curated for cinematic architecture, warm light, and the kind of mood that makes a trip feel rare."
          />

          <div
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-12"
            style={{ gridAutoRows: '200px' }}
          >
            {popularDestinations.map((destination, index) => (
              <TiltCard
                key={`${destination.name}-${index}`}
                onClick={() =>
                  navigate(
                    `/blog?destination=${encodeURIComponent(destination.name)}`
                  )
                }
                className={`group relative overflow-hidden rounded-[24px] border border-black/[0.06] ${GRID_SPANS[index]}`}
              >
                <img
                  src={destination.image}
                  alt={destination.name}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Dark gradient overlay for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/95 via-[#07111f]/40 to-transparent" />

                {/* Hotels count + temperature badge */}
                <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
                  {destination.hotels} · {destination.temp}
                </span>

                {/* Bottom content area */}
                <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                  <p
                    className={`font-playfair text-white ${
                      index === 0
                        ? 'text-4xl md:text-5xl'
                        : index === 4 || index === 8
                          ? 'text-3xl md:text-4xl'
                          : 'text-2xl md:text-3xl'
                    }`}
                  >
                    {destination.name}
                  </p>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                    {destination.description}
                  </p>

                  {/* Hover‑revealed CTA */}
                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F5D08A] opacity-0 transition-all duration-300 group-hover:opacity-100">
                    <span>View destination</span>
                    <ArrowRight className="w-3.5" />
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default PopularDestinations
