// Organized central exports for components

// Layout
export { default as Navbar } from './Navbar.jsx'
export { default as Footer } from './Footer.jsx'
export { default as Hero } from './Hero.jsx'
export { default as Title } from './Title.jsx'
export { default as NewsLetter } from './NewsLetter.jsx'

// Cards
export { default as HotelCard } from './HotelCard.jsx'
export { default as FeaturedDestination } from './FeaturedDestination.jsx'
export { default as Testimonial } from './Testimonial.jsx'
export { default as StarRating } from './StarRating.jsx'
export { default as ExclusiveOffer } from './ExclusiveOffer.jsx'

// Modals / Forms
export { default as HotelReg } from './HotelReg.jsx'
export { default as BookingModal } from './BookingModal.jsx'
export { default as InvoiceBill } from './InvoiceBill.jsx'
export { default as ServicePortal } from './ServicePortal.jsx'
export { default as ChatBot } from './ChatBot.jsx'

// Sections
export { default as ExperienceShowcase } from './ExperienceShowcase.jsx'
export { default as PopularDestinations } from './PopularDestinations.jsx'
export { default as AIPlannerSection } from './AIPlannerSection.jsx'

// Dashboards and feature folders (re-export entire folder namespace)
export * as Dashboard from './dashboard'
export * as TripPlanner from './TripPlanner'

// Fallback: export any remaining components from the top-level files for compatibility
export { default as BookingModalLegacy } from './BookingModal.jsx'
