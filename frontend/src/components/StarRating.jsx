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
            className={`w-4 h-4 ${rating > index ? 'text-[#5077B3] dark:text-[#93B3E0] fill-[#5077B3]' : 'text-slate-300 dark:text-[#4E646B]'}`}
          />
        ))}
    </>
  )
}

export default StarRating
