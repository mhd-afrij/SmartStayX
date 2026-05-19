import { motion } from 'framer-motion'
import destinationsData from '../../data/tripPlanner/destinationsData'

const continentColors = {
  Europe: 'bg-blue-500/15 text-blue-400',
  Asia: 'bg-amber-500/15 text-amber-400',
  Americas: 'bg-emerald-500/15 text-emerald-400',
  Africa: 'bg-orange-500/15 text-orange-400',
  Oceania: 'bg-cyan-500/15 text-cyan-400',
}

const DestinationsGrid = ({ selected, onSelect }) => {
  return (
    <div className='max-w-6xl mx-auto'>
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4'>
        {destinationsData.map((dest, i) => (
          <motion.button
            key={dest.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => onSelect(dest.name)}
            className={`relative group rounded-2xl overflow-hidden aspect-[4/5] border-2 transition-all duration-300 ${
              selected === dest.name
                ? 'border-[#D4A85F] shadow-[0_0_30px_-8px_#D4A85F] scale-[1.02]'
                : 'border-white/[0.06] hover:border-white/20'
            }`}
          >
            <img
              src={dest.image}
              alt={dest.name}
              className='absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110'
            />
            <div className='absolute inset-0 bg-gradient-to-t from-[#07111f]/90 via-[#07111f]/20 to-transparent' />
            <div className='absolute top-2 left-2'>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-space font-medium ${continentColors[dest.continent] || 'bg-white/10 text-white/60'}`}>
                {dest.continent}
              </span>
            </div>
            <div className='absolute bottom-0 left-0 right-0 p-3 md:p-4 text-left'>
              <p className='text-white font-playfair text-sm md:text-lg font-bold'>{dest.name}</p>
              <p className='text-white/50 text-[10px] md:text-xs mt-0.5 leading-tight line-clamp-2'>{dest.description}</p>
            </div>
            {selected === dest.name && (
              <div className='absolute top-2 right-2 h-5 w-5 md:h-6 md:w-6 rounded-full bg-[#D4A85F] flex items-center justify-center'>
                <svg className='h-3 w-3 text-[#07111f]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                  <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                </svg>
              </div>
            )}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default DestinationsGrid
