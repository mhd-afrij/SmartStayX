import React from 'react'
import { motion } from 'framer-motion'
import Title from './Title'
import { testimonials } from '../assets/assets'
import StarRating from './StarRating'

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
              className="luxury-card p-6"
            >
              <div className="flex items-center gap-3">
                <img
                  className="h-12 w-12 rounded-full border border-white/10 object-cover"
                  src={testimonial.image}
                  alt={testimonial.name}
                />
                <div>
                  <p className="font-playfair text-lg text-white">{testimonial.name}</p>
                  <p className="text-sm text-white/50">{testimonial.address}</p>
                </div>
              </div>
              <div className="mt-4">
                <StarRating />
              </div>
              <p className="mt-4 text-sm leading-relaxed text-white/65">"{testimonial.review}"</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Testimonial
