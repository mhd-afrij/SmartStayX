export const PLACEHOLDER_IMAGE_URL =
  process.env.PLACEHOLDER_IMAGE_URL || 'https://via.placeholder.com/150'

export const CLERK_API_BASE_URL =
  process.env.CLERK_API_BASE_URL || 'https://api.clerk.com'

export const DEFAULT_TESTIMONIALS = [
  {
    name: 'Emma Rodriguez',
    address: 'Barcelona, Spain',
    image: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=200',
    rating: 5,
    review:
      'I\'ve used many booking platforms before, but none compare to the personalized experience and attention to detail that SmartStayX provides.',
  },
  {
    name: 'Liam Johnson',
    address: 'New York, USA',
    image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
    rating: 4,
    review:
      'SmartStayX exceeded my expectations. The booking process was seamless, and the hotels were absolutely top-notch. Highly recommended!',
  },
  {
    name: 'Sophia Lee',
    address: 'Seoul, South Korea',
    image: 'https://images.unsplash.com/photo-1701615004837-40d8573b6652?q=80&w=200',
    rating: 5,
    review:
      'Amazing service! I always find the best luxury accommodations through SmartStayX. Their recommendations never disappoint!',
  },
]
