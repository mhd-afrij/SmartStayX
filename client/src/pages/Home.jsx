// Home — Main landing page composing hero, stats, featured destinations, offers, testimonials, and more
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
import AIPlannerSection from '../components/AIPlannerSection'
import NewsLetter from '../components/NewsLetter'

const Home = () => {
  useEffect(() => {
    document.title = 'SmartStayX — Discover Your Perfect Gateway Destination';
  }, []);

  return (
    <>
    {/* Hero and discovery sections */}
    <Hero />
    <StatsSection />
    <PopularDestinations />
    <FeaturedDestination/>

    {/* Experience and offer highlights */}
    <ExperienceShowcase />
    <ExclusiveOffer/>
    <Testimonial/>

    {/* Travel inspiration */}
    <BlogPreviews />
    <SocialWall />

    {/* Planning and newsletter signup */}
    <AIPlannerSection />
    <NewsLetter/>
    
    </>
  )
}

export default Home