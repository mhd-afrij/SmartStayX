import { useState, useEffect } from 'react'
import { useAppContext } from '../../context/AppContext'

const HotelPicker = ({ destination, selectedHotel, onSelect }) => {
  const { getToken, formatPrice, translate } = useAppContext()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!destination) return
    const fetchHotels = async () => {
      setLoading(true)
      setError(false)
      try {
        const token = await getToken()
        const res = await fetch(`/api/hotels/search?city=${encodeURIComponent(destination)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const data = await res.json()
        if (data.success && data.hotels?.length) {
          setHotels(data.hotels)
        } else {
          setHotels([])
          setError(true)
        }
      } catch {
        setError(true)
        setHotels([])
      } finally {
        setLoading(false)
      }
    }
    fetchHotels()
  }, [destination, getToken])

  if (loading) {
    return (
      <div className='max-w-3xl mx-auto text-center py-8'>
        <div className='h-6 w-6 rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin mx-auto mb-3' />
        <p className='text-xs text-white/40 font-space'>{translate('findingHotels')}</p>
      </div>
    )
  }

  if (error || hotels.length === 0) {
    return (
      <div className='max-w-3xl mx-auto'>
        <div className='rounded-2xl border border-white/[0.06] bg-white/[0.03] p-8 text-center'>
          <p className='text-white/40 text-sm mb-1'>{translate('noHotelsFound')}</p>
          <p className='text-white/20 text-xs'>{translate('tryDifferentDestination')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto'>
      <p className='text-sm text-white/50 mb-4 text-center'>{translate('selectHotel')}</p>
      <div className='space-y-3'>
        {hotels.slice(0, 5).map((hotel) => {
          const isSelected = selectedHotel?._id === hotel._id
          return (
            <button
              key={hotel._id}
              onClick={() => onSelect(isSelected ? null : hotel)}
              className={`w-full text-left flex items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-300 ${
                isSelected
                  ? 'border-[#D4A85F] bg-[#D4A85F]/5'
                  : 'border-white/[0.06] bg-white/[0.02] hover:border-white/15'
              }`}
            >
              <div className='h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden shrink-0 bg-white/[0.04]'>
                {hotel.image ? (
                  <img src={hotel.image} alt={hotel.name} className='w-full h-full object-cover' />
                ) : (
                  <div className='w-full h-full flex items-center justify-center text-white/20 text-xs'>{translate('noImage')}</div>
                )}
              </div>
              <div className='flex-1 min-w-0'>
                <p className='text-base font-playfair font-bold text-white truncate'>{hotel.name}</p>
                <p className='text-xs text-white/40 font-space truncate mt-0.5'>{hotel.address}</p>
                {hotel.description && (
                  <p className='text-xs text-white/30 mt-1 line-clamp-1'>{hotel.description}</p>
                )}
              </div>
              {isSelected && (
                <div className='h-6 w-6 rounded-full bg-[#D4A85F] flex items-center justify-center shrink-0'>
                  <svg className='h-3.5 w-3.5 text-[#07111f]' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={3}>
                    <path strokeLinecap='round' strokeLinejoin='round' d='M5 13l4 4L19 7' />
                  </svg>
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default HotelPicker
