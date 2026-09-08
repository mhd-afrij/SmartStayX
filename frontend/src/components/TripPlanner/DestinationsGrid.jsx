// DestinationsGrid — Grid of trip planner destination cards with images and descriptions
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import destinationsData from '../../data/tripPlanner/destinationsData'

const continentColors = {
  Europe: 'bg-[#EFEDF7] dark:bg-[#1B2436] text-[#5077B3] dark:text-[#93B3E0]',
  Asia: 'bg-[#F4F2F9] dark:bg-[#1B2436] text-amber-700 dark:text-amber-300',
  Americas: 'bg-emerald-50 text-emerald-700',
  Africa: 'bg-orange-50 text-orange-700',
  Oceania: 'bg-cyan-50 text-cyan-700',
}

const DestinationsGrid = ({ selected, onSelect }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
      {destinationsData.map((dest, i) => (
        <motion.button
          key={dest.name}
          type="button"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: i * 0.03, ease: [0.22, 1, 0.36, 1] }}
          onClick={() => onSelect(dest.name)}
          className={`relative group rounded-2xl overflow-hidden aspect-[4/5] border-2 transition-all duration-300 ${
            selected === dest.name
              ? 'border-[#D4A853] shadow-[0_0_0_4px_rgba(212,168,83,0.15)] scale-[1.02]'
              : 'border-[#E8E0D1] dark:border-[#1D3842] hover:border-[#5077B3]/40'
          }`}
        >
          <img
            src={dest.image}
            alt={dest.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
          <div className="absolute top-2 left-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-space font-medium ${continentColors[dest.continent] || 'bg-white/80 dark:bg-[#0E242C]/80 text-slate-600 dark:text-[#9FB2B8]'}`}>
              {dest.continent}
            </span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 text-left">
            <p className="text-white font-playfair text-sm md:text-lg font-bold">{dest.name}</p>
            <p className="text-white/70 text-[10px] md:text-xs mt-0.5 leading-tight line-clamp-2">{dest.description}</p>
          </div>
          {selected === dest.name && (
            <div className="absolute top-2 right-2 h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#D4A853] flex items-center justify-center">
              <Check className="h-3 w-3 text-[#003844] dark:text-[#E9F1F2]" strokeWidth={3} />
            </div>
          )}
        </motion.button>
      ))}
    </div>
  )
}

export default DestinationsGrid
