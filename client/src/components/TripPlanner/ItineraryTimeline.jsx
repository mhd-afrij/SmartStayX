// ItineraryTimeline — Visual day-by-day itinerary timeline with draggable entries
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppContext } from '../../context/AppContext'
import destinationsData from '../../data/tripPlanner/destinationsData'

const SLOTS = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { key: 'evening', label: 'Evening', icon: '🌙' },
]

const ItineraryTimeline = ({ destination, checkIn, checkOut, itinerary, setItinerary }) => {
  const { translate, getToken } = useAppContext()
  const [openDay, setOpenDay] = useState(0)
  const [addingTo, setAddingTo] = useState(null)
  const [suggesting, setSuggesting] = useState(false)

  const destData = destinationsData.find((d) => d.name === destination)

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 1
    const ms = new Date(checkOut) - new Date(checkIn)
    return Math.max(1, Math.ceil(ms / (1000 * 3600 * 24)))
  }, [checkIn, checkOut])

  const days = useMemo(() => {
    const arr = []
    for (let i = 0; i < nights; i++) {
      const d = new Date(checkIn)
      d.setDate(d.getDate() + i)
      arr.push(d)
    }
    return arr
  }, [nights, checkIn])

  const getDayPlan = (dayIndex) => {
    return itinerary[dayIndex] || { morning: null, afternoon: null, evening: null }
  }

  const setSlot = (dayIndex, slotKey, item) => {
    setItinerary((prev) => {
      const copy = [...prev]
      if (!copy[dayIndex]) copy[dayIndex] = { morning: null, afternoon: null, evening: null }
      copy[dayIndex] = { ...copy[dayIndex], [slotKey]: item }
      return copy
    })
    setAddingTo(null)
  }

  const removeSlot = (dayIndex, slotKey) => {
    setItinerary((prev) => {
      const copy = [...prev]
      if (copy[dayIndex]) {
        copy[dayIndex] = { ...copy[dayIndex], [slotKey]: null }
      }
      return copy
    })
  }

  const handleSuggest = async () => {
    if (!destData) return
    setSuggesting(true)
    try {
      const token = await getToken()
      const prompt = `Suggest a ${nights}-day trip itinerary for ${destination}. For each day give one morning activity, one afternoon activity, and one evening restaurant. Keep it brief — activity name only.`
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: prompt }),
      })
      const data = await res.json()
      if (data.success && data.reply) {
        return
      }
    } catch {
    } finally {
      setSuggesting(false)
    }
  }

  const totalItems = itinerary.reduce((sum, day) => {
    let count = 0
    if (day?.morning) count++
    if (day?.afternoon) count++
    if (day?.evening) count++
    return sum + count
  }, 0)

  const formatDay = (date) =>
    date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='flex items-center justify-between mb-6'>
        <p className='text-white/50 text-sm'>
          {nights} {nights > 1 ? translate('nights') : translate('night')} in <span className='text-[#D4A85F] font-medium'>{destination}</span>
        </p>
        <button
          onClick={handleSuggest}
          disabled={suggesting}
          className='px-4 py-2 ghost-button text-xs uppercase tracking-[0.15em] disabled:opacity-40'
        >
          {suggesting ? translate('thinking') : translate('suggestItinerary')}
        </button>
      </div>

      <div className='space-y-3'>
        {days.map((date, dayIndex) => {
          const dayPlan = getDayPlan(dayIndex)
          const isOpen = openDay === dayIndex
          const filled = [dayPlan.morning, dayPlan.afternoon, dayPlan.evening].filter(Boolean).length

          return (
            <div key={dayIndex} className='rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden'>
              <button
                onClick={() => setOpenDay(isOpen ? null : dayIndex)}
                className='w-full flex items-center justify-between px-5 py-4 text-left transition-colors hover:bg-white/[0.03]'
              >
                <div className='flex items-center gap-3'>
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-space font-bold ${isOpen ? 'bg-[#D4A85F] text-[#07111f]' : 'bg-white/[0.06] text-white/50'}`}>
                    {dayIndex + 1}
                  </div>
                  <div>
                    <p className='text-sm font-playfair font-bold text-white'>Day {dayIndex + 1}</p>
                    <p className='text-xs text-white/40 font-space'>{formatDay(date)}</p>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-white/30 font-space'>
                    {filled}/{SLOTS.length}
                  </span>
                  <svg className={`h-4 w-4 text-white/40 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M19 9l-7 7-7-7' />
                  </svg>
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className='overflow-hidden'
                  >
                    <div className='px-5 pb-5 space-y-3 border-t border-white/[0.06] pt-4'>
                      {SLOTS.map((slot) => {
                        const item = dayPlan[slot.key]
                        return (
                          <div key={slot.key} className='flex items-start gap-3'>
                            <span className='text-base mt-1'>{slot.icon}</span>
                            <div className='flex-1 min-w-0'>
                              <p className='text-[10px] uppercase tracking-[0.15em] text-white/30 font-space mb-1.5'>{slot.label}</p>
                              {item ? (
                                <div className='flex items-center justify-between bg-white/[0.04] rounded-xl px-4 py-2.5 border border-white/[0.06] group'>
                                  <div className='min-w-0'>
                                    <p className='text-sm text-white/80 font-medium truncate'>{item.name}</p>
                                    {item.desc && <p className='text-xs text-white/40 truncate'>{item.desc}</p>}
                                  </div>
                                  <button
                                    onClick={() => removeSlot(dayIndex, slot.key)}
                                    className='shrink-0 ml-2 h-6 w-6 rounded-full bg-white/[0.06] flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100'
                                  >
                                    <svg className='h-3 w-3' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                                      <path strokeLinecap='round' strokeLinejoin='round' d='M6 18L18 6M6 6l12 12' />
                                    </svg>
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAddingTo(addingTo === `${dayIndex}-${slot.key}` ? null : `${dayIndex}-${slot.key}`)}
                                  className='w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/20 transition-all text-xs'
                                >
                                  <svg className='h-3.5 w-3.5' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                                    <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
                                  </svg>
                                  {translate('addActivity')}
                                </button>
                              )}

                              {addingTo === `${dayIndex}-${slot.key}` && destData && (
                                <motion.div
                                  initial={{ opacity: 0, y: -8 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className='mt-2 rounded-xl bg-white/[0.04] border border-white/[0.06] p-3 space-y-1.5'
                                >
                                  <p className='text-[10px] uppercase tracking-[0.15em] text-white/30 font-space mb-2'>
                                    {slot.key === 'evening' ? translate('restaurants') : translate('attractions')}
                                  </p>
                                  {(slot.key === 'evening' ? destData.restaurants : destData.attractions).map((item) => (
                                    <button
                                      key={item.name}
                                      onClick={() => setSlot(dayIndex, slot.key, item)}
                                      className='w-full text-left flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/[0.06] transition-colors'
                                    >
                                      <div>
                                        <p className='text-sm text-white/70'>{item.name}</p>
                                        <p className='text-[11px] text-white/40'>{item.desc}</p>
                                      </div>
                                      <svg className='h-4 w-4 text-white/20 shrink-0' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
                                        <path strokeLinecap='round' strokeLinejoin='round' d='M12 4v16m8-8H4' />
                                      </svg>
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>

      {totalItems === 0 && (
        <div className='mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 text-center'>
          <p className='text-white/40 text-sm'>{translate('itineraryEmpty')}</p>
        </div>
      )}
    </div>
  )
}

export default ItineraryTimeline
