/**
 * Home — Root landing page that composes all home‑page section components
 * (hero, stats, destinations, offers, testimonials, blog, etc.).
 */
import React, { useEffect } from 'react'
import Hero from '../components/Hero'
import StatsSection from '../components/StatsSection'
import FeaturedDestination from '../components/FeaturedDestination'
import PopularDestinations from '../components/PopularDestinations'
import ExclusiveOffer from '../components/ExclusiveOffer'
import ExperienceShowcase from '../components/ExperienceShowcase'
import Testimonial from '../components/Testimonial'
import BlogPreviews from '../components/BlogPreviews'
import SocialWall from '../components/SocialWall'
import NewsLetter from '../components/NewsLetter'
import RecommendedRooms from '../components/RecommendedRooms'

const Home = () => {
  useEffect(() => {
    document.title = 'SmartStayX — Discover Your Perfect Gateway Destination'
  }, [])

  return (
    <>
      {/* Hero + discovery */}
      <Hero />
      <StatsSection />
      <PopularDestinations />
      <FeaturedDestination />

      {/* Experiences + offers */}
      <ExperienceShowcase />
      <RecommendedRooms />
      <ExclusiveOffer />
      <Testimonial />

      {/* Travel inspiration */}
      <BlogPreviews />
      <SocialWall />

      <NewsLetter />
    </>
  )
}

export default Home
