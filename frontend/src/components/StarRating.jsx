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
            className={`w-4 h-4 ${rating > index ? 'text-[#183B35] dark:text-[#8FB8A8] fill-[#183B35]' : 'text-slate-300 dark:text-[#A9AEA7]'}`}
          />
        ))}
    </>
  )
}

export default StarRating
