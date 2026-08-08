import React from 'react'
import { Star } from 'lucide-react'

const StarRating = ({ rating = 4 }) => {
  return (
    <>
      {Array(5)
        .fill()
        .map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${rating > index ? 'text-[#F5D08A] fill-[#F5D08A]' : 'text-white/20'}`}
          />
        ))}
    </>
  )
}

export default StarRating
