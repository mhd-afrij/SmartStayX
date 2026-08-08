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
            className={`w-4 h-4 ${rating > index ? 'text-[#2563EB] fill-[#2563EB]' : 'text-slate-300'}`}
          />
        ))}
    </>
  )
}

export default StarRating
