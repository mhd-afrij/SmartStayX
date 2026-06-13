// StatsSection — Animated statistics and achievement metrics section
import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: '500+', label: 'Luxury Properties' },
  { value: '10K+', label: 'Happy Guests' },
  { value: '4.9', label: 'Average Rating' },
  { value: '50+', label: 'Destinations' },
];

const StatsSection = () => {
  return (
    <section className="luxury-section pt-0">
      <div className="mx-auto max-w-7xl">
        <div className="luxury-card relative overflow-hidden px-6 py-12 md:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,168,95,0.08),transparent_50%)]" />
          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <p className="font-playfair text-4xl md:text-5xl text-[#F5D08A]">{stat.value}</p>
                <p className="mt-1.5 text-sm uppercase tracking-[0.18em] text-white/50">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
