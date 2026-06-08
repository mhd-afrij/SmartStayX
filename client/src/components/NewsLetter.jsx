import React, { useState } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { assets } from '../assets/assets'
import Title from './Title'

const NewsLetter = () => {
  const [email, setEmail] = useState('');

  const handleSubscribe = () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
    toast.success('You\'ve been subscribed! Welcome to SmartStayX.');
    setEmail('');
  };

  return (
    <section className="luxury-section">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mx-auto max-w-5xl luxury-card relative overflow-hidden px-6 py-16 md:py-20"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,168,95,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.05),transparent_28%)]" />
        <div className="relative">
          <Title
            kicker="Stay Connected"
            title="Stay Inspired"
            subtitle="Join our newsletter and be the first to discover new updates, exclusive offers, and inspiration."
          />

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mt-8">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              className="luxury-input max-w-72 w-full text-sm"
              placeholder="Enter your email"
            />
            <button onClick={handleSubscribe} className="gold-button px-7 py-3 text-sm uppercase tracking-[0.18em] whitespace-nowrap">
              Subscribe
              <img src={assets.arrowIcon} alt="arrow" className="w-3.5" />
            </button>
          </div>
          <p className="text-white/40 mt-6 text-xs text-center">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </motion.div>
    </section>
  )
}

export default NewsLetter
