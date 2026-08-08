// HotelPicker — Hotel selection list for a trip destination
import { useState, useEffect } from 'react'
import { Check, ImageOff } from 'lucide-react'
import { useAppContext } from '../../context/AppContext'
import { SkeletonCard, EmptyState } from '../ui/States'

const HotelPicker = ({ destination, selectedHotel, onSelect }) => {
  const { axios, translate } = useAppContext()
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!destination) return
    let active = true
    const fetchHotels = async () => {
      setLoading(true)
      setError(false)
      try {
        const { data } = await axios.get('/api/hotels/search', { params: { city: destination } })
        if (!active) return
        if (data.success && data.hotels?.length) {
          setHotels(data.hotels)
        } else {
          setHotels([])
          setError(true)
        }
      } catch {
        if (active) {
          setError(true)
          setHotels([])
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    fetchHotels()
    return () => { active = false }
  }, [destination, axios])

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[1, 2].map((i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (error || hotels.length === 0) {
    return (
      <EmptyState
        icon={ImageOff}
        title={translate('noHotelsFound')}
        description={translate('tryDifferentDestination')}
      />
    )
  }

  return (
    <div className="space-y-3">
      {hotels.slice(0, 5).map((hotel) => {
        const isSelected = selectedHotel?._id === hotel._id
        return (
          <button
            key={hotel._id}
            type="button"
            onClick={() => onSelect(isSelected ? null : hotel)}
            className={`w-full text-left flex items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 ${
              isSelected ? 'border-[#D4A853] bg-[#FBF2E1]' : 'border-[#E2E8F0] bg-white hover:border-[#2563EB]/40'
            }`}
          >
            <div className="h-16 w-16 md:h-20 md:w-20 rounded-xl overflow-hidden shrink-0 bg-[#F1F5F9]">
              {hotel.image ? (
                <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#94A3B8] text-xs">{translate('noImage')}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-playfair font-bold text-[#0F172A] truncate">{hotel.name}</p>
              <p className="text-xs text-[#64748B] font-space truncate mt-0.5">{hotel.address}</p>
              {hotel.description && (
                <p className="text-xs text-[#94A3B8] mt-1 line-clamp-1">{hotel.description}</p>
              )}
            </div>
            {isSelected && (
              <div className="h-6 w-6 rounded-full bg-[#D4A853] flex items-center justify-center shrink-0">
                <Check className="h-3.5 w-3.5 text-[#0F172A]" strokeWidth={3} />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default HotelPicker
