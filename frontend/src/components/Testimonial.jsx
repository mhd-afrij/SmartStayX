/**
 * Testimonial — Guest review cards with star ratings, avatar images,
 * quote icon on hover, and 3D mouse‑track tilt.
 */
import React from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import Title from './Title'
import { testimonials } from '../assets/assets'
import StarRating from './StarRating'
import TiltCard from './TiltCard'

const Testimonial = () => {
  return (
    <section className="luxury-section">
      <div className="mx-auto max-w-7xl">
        <Title
          kicker="Guest Stories"
          title="What Our Guests Say"
          subtitle="Discover why discerning travelers consistently choose SmartStayX for their exclusive and luxurious accommodations around the world."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
            >
              <TiltCard maxTilt={3} className="luxury-card relative p-6 group">
                {/* Quote icon on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <Quote className="w-6 h-6 text-[#2563EB]/25" />
                </div>

                {/* Avatar row */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2563EB]/25 to-transparent blur-sm" />
                    <img
                      className="relative h-12 w-12 rounded-full border border-black/[0.08] object-cover"
                      src={testimonial.image}
                      alt={testimonial.name}
                    />
                  </div>
                  <div>
                    <p className="font-playfair text-lg text-slate-900">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {testimonial.address}
                    </p>
                  </div>
                </div>

                {/* Star rating */}
                <div className="mt-4 flex">
                  <StarRating rating={testimonial.rating} />
                </div>

                {/* Review text */}
                <p className="mt-4 text-sm leading-relaxed text-slate-600 italic">
                  &ldquo;{testimonial.review}&rdquo;
                </p>

                {/* Visual rating bar */}
                <div className="mt-5 pt-4 border-t border-black/[0.06]">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                          i < testimonial.rating
                            ? 'bg-[#2563EB]/50'
                            : 'bg-black/[0.06]'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonial
