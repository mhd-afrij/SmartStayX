import React from 'react'
import { motion } from 'framer-motion'
import Title from './Title'
import { testimonials } from '../assets/assets'
import StarRating from './StarRating'

const quote = (
  <svg className="w-6 h-6 text-[#D4A85F]/20" fill="currentColor" viewBox="0 0 24 24">
    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
  </svg>
)

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
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="luxury-card relative p-6 group"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {quote}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#D4A85F]/30 to-transparent blur-sm" />
                  <img
                    className="relative h-12 w-12 rounded-full border border-white/10 object-cover"
                    src={testimonial.image}
                    alt={testimonial.name}
                  />
                </div>
                <div>
                  <p className="font-playfair text-lg text-white">{testimonial.name}</p>
                  <p className="text-xs text-white/40">{testimonial.address}</p>
                </div>
              </div>

              <div className="mt-4 flex">
                <StarRating rating={testimonial.rating} />
              </div>

              <p className="mt-4 text-sm leading-relaxed text-white/65 italic">
                &ldquo;{testimonial.review}&rdquo;
              </p>

              <div className="mt-5 pt-4 border-t border-white/5">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${
                        i < testimonial.rating ? 'bg-[#D4A85F]/40' : 'bg-white/5'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonial
