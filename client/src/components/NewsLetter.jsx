/**
 * NewsLetter — Email subscription card with validation, toast feedback,
 * and a 3D scroll‑reveal animation.
 */
import React, { useState, useRef } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import toast from 'react-hot-toast'
import Title from './Title'

/** Simple email regex for client‑side validation */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const NewsLetter = () => {
  const [email, setEmail] = useState('')
  const sectionRef = useRef(null)

  // 3D scroll reveal
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })
  const cardRotateX = useTransform(scrollYProgress, [0, 0.3], [5, 0])
  const cardY = useTransform(scrollYProgress, [0, 0.3], [30, 0])

  /** Validate and submit the subscription */
  const handleSubscribe = () => {
    if (!email || !EMAIL_REGEX.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    toast.success("You've been subscribed! Welcome to SmartStayX.")
    setEmail('')
  }

  return (
    <section
      ref={sectionRef}
      className="luxury-section"
      style={{ perspective: '1000px' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        style={{
          rotateX: cardRotateX,
          y: cardY,
          transformStyle: 'preserve-3d',
        }}
        className="mx-auto max-w-5xl luxury-card relative overflow-hidden px-6 py-16 md:py-20"
      >
        {/* Gold + white radial glows */}
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
            <button
              onClick={handleSubscribe}
              className="gold-button px-7 py-3 text-sm uppercase tracking-[0.18em] whitespace-nowrap"
            >
              Subscribe
              <ArrowRight className="w-3.5" />
            </button>
          </div>

          <p className="text-white/40 mt-6 text-xs text-center">
            By subscribing, you agree to our Privacy Policy and consent to
            receive updates.
          </p>
        </div>
      </motion.div>
    </section>
  )
}

export default NewsLetter
