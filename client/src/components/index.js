// Organized central exports for components

// Layout
export { default as Navbar } from './layout/Navbar.jsx'
export { default as Footer } from './layout/Footer.jsx'
export { default as Hero } from './layout/Hero.jsx'
export { default as Title } from './layout/Title.jsx'
export { default as NewsLetter } from './layout/NewsLetter.jsx'

// Cards
export { default as HotelCard } from './cards/HotelCard.jsx'
export { default as FeaturedDestination } from './cards/FeaturedDestination.jsx'
export { default as Testimonial } from './cards/Testimonial.jsx'
export { default as StarRating } from './cards/StarRating.jsx'
export { default as ExclusiveOffer } from './cards/ExclusiveOffer.jsx'

// Modals / Forms
export { default as HotelReg } from './modals/HotelReg.jsx'
export { default as BookingModal } from './modals/BookingModal.jsx'
export { default as InvoiceBill } from './modals/InvoiceBill.jsx'
export { default as ServicePortal } from './modals/ServicePortal.jsx'
export { default as ChatBot } from './modals/ChatBot.jsx'

// Sections
export { default as ExperienceShowcase } from './sections/ExperienceShowcase.jsx'
export { default as PopularDestinations } from './sections/PopularDestinations.jsx'
export { default as AIPlannerSection } from './sections/AIPlannerSection.jsx'

// Dashboards and feature folders (re-export entire folder namespace)
export * as Dashboard from './dashboard'
export * as TripPlanner from './TripPlanner'

// Fallback: export any remaining components from the top-level files for compatibility
export { default as BookingModalLegacy } from './BookingModal.jsx'
