import React from 'react'
import Hero from '../components/Hero'
import FeaturedDestination from '../components/FeaturedDestination'
import PopularDestinations from '../components/PopularDestinations'
import ExclusiveOffer from '../components/ExclusiveOffer'
import ExperienceShowcase from '../components/ExperienceShowcase'
import Testimonial from '../components/Testimonial'
import AIPlannerSection from '../components/AIPlannerSection'
import NewsLetter from '../components/NewsLetter'

const Home = () => {
  return (
    <>
    {/* Hero and discovery sections */}
    <Hero />
    <PopularDestinations />
    <FeaturedDestination/>

    {/* Experience and offer highlights */}
    <ExperienceShowcase />
    <ExclusiveOffer/>
    <Testimonial/>

    {/* Planning and newsletter signup */}
    <AIPlannerSection />
    <NewsLetter/>
   
    </>
  )
}

export default Home