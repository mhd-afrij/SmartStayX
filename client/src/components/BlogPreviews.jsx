/**
 * BlogPreviews — Three article preview cards (first 3 popular destinations)
 * linked to the blog filtered by destination, with 3D tilt on each card.
 */
import React from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import Title from './Title'
import popularDestinations from '../data/popularDestinations'
import TiltCard from './TiltCard'

const BlogPreviews = () => {
  const previews = popularDestinations.slice(0, 3)

  return (
    <section className="luxury-section">
      <div className="mx-auto max-w-7xl space-y-8">
        <Title
          align="left"
          kicker="From the Journal"
          title="Stories Behind the Stays"
          subtitle="Curated narratives from our most beloved destinations, written for the curious traveler."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {previews.map((dest, i) => (
            <motion.article
              key={dest.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <TiltCard
                maxTilt={4}
                className="overflow-hidden rounded-[24px] border border-white/10"
              >
                <Link
                  to={`/blog?destination=${encodeURIComponent(dest.name)}`}
                  className="group block"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={dest.image}
                      alt={dest.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/90 via-[#07111f]/30 to-transparent" />
                    <span className="absolute bottom-4 left-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
                      {dest.hotels}
                    </span>
                  </div>

                  <div className="p-5">
                    <p className="font-playfair text-xl text-white group-hover:text-[#D4A85F] transition-colors">
                      {dest.name}
                    </p>
                    <p className="mt-2 text-sm text-white/60 line-clamp-2">
                      {dest.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F5D08A]">
                      <span>Read article</span>
                      <ArrowRight className="w-3.5" />
                    </div>
                  </div>
                </Link>
              </TiltCard>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default BlogPreviews
