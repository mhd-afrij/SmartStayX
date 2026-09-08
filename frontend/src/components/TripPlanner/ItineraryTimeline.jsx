// ItineraryTimeline — Day-by-day itinerary timeline with directions, replace, and remove actions
import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, MapPin, Navigation, Pencil, Star, X } from 'lucide-react'
import { Input, Select } from '../ui'

const TYPE_LABEL = {
  attraction: 'Attraction',
  restaurant: 'Restaurant',
  activity: 'Activity',
  hotel: 'Hotel',
}

const ItineraryTimeline = ({ items = [], onRemove, onReplace }) => {
  const [openDay, setOpenDay] = useState(1)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ title: '', type: 'activity', address: '', notes: '' })

  const byDay = useMemo(() => {
    const map = {}
    items.forEach((item) => {
      const day = item.day || 1
      if (!map[day]) map[day] = []
      map[day].push(item)
    })
    return map
  }, [items])

  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b)

  const startEdit = (item) => {
    setEditingId(item._id)
    setEditForm({ title: item.title, type: item.type, address: item.address || '', notes: item.notes || '' })
  }

  const submitEdit = (item) => {
    onReplace?.(item, editForm)
    setEditingId(null)
  }

  const directionsUrl = (item) =>
    `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(item.address || item.title)}`

  if (days.length === 0) {
    return (
      <div className="luxury-card-soft p-8 text-center">
        <p className="text-[#5C6B64] dark:text-[#A9AEA7] text-sm">No itinerary items yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isOpen = openDay === day
        const dayItems = byDay[day]
        return (
          <div key={day} className="luxury-card overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenDay(isOpen ? null : day)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#F7F5F0] dark:hover:bg-[#111412] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-space font-bold ${isOpen ? 'bg-[#A67C52] text-[#183B35] dark:text-[#F2EFE8]' : 'bg-[#EFEEE8] dark:bg-[#222823] text-[#5C6B64] dark:text-[#A9AEA7]'}`}>
                  {day}
                </div>
                <p className="text-sm font-playfair font-bold text-[#183B35] dark:text-[#F2EFE8]">Day {day}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#72766F] dark:text-[#A9AEA7] font-space">{dayItems.length} items</span>
                <ChevronDown className={`h-4 w-4 text-[#5C6B64] dark:text-[#A9AEA7] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-3 border-t border-[#E3E0D8] dark:border-[#303631] pt-4">
                    {dayItems.map((item) => (
                      <div key={item._id} className="rounded-xl border border-[#E3E0D8] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-4">
                        {editingId === item._id ? (
                          <div className="space-y-2">
                            <Input label="Title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                            <Select label="Type" value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}>
                              <option value="attraction">Attraction</option>
                              <option value="restaurant">Restaurant</option>
                              <option value="activity">Activity</option>
                              <option value="hotel">Hotel</option>
                            </Select>
                            <Input label="Address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
                            <Input label="Notes" value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                            <div className="flex gap-2 pt-1">
                              <button type="button" onClick={() => submitEdit(item)} className="gold-button text-xs px-4 py-2">Save</button>
                              <button type="button" onClick={() => setEditingId(null)} className="ghost-button text-xs px-4 py-2">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div className="h-14 w-14 shrink-0 rounded-lg bg-[#EFEEE8] dark:bg-[#222823] overflow-hidden flex items-center justify-center">
                              {item.photoUrl ? (
                                <img src={item.photoUrl} alt={item.title} className="h-full w-full object-cover" />
                              ) : (
                                <MapPin className="h-5 w-5 text-[#72766F] dark:text-[#A9AEA7]" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-[#EFEEE8] dark:bg-[#222823] text-[#5C6B64] dark:text-[#A9AEA7]">
                                  {TYPE_LABEL[item.type] || item.type}
                                </span>
                                {item.rating > 0 && (
                                  <span className="flex items-center gap-0.5 text-[10px] text-[#8A643F] dark:text-[#C5A47E]">
                                    <Star className="h-3 w-3 fill-current" /> {item.rating}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-[#183B35] dark:text-[#F2EFE8] mt-1">{item.title}</p>
                              {item.address && <p className="text-xs text-[#5C6B64] dark:text-[#A9AEA7] mt-0.5">{item.address}</p>}
                              {item.notes && <p className="text-xs text-[#72766F] dark:text-[#A9AEA7] mt-1">{item.notes}</p>}
                              <div className="flex items-center gap-3 mt-2">
                                <a
                                  href={directionsUrl(item)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs text-[#183B35] dark:text-[#8FB8A8] font-medium hover:underline"
                                >
                                  <Navigation className="h-3 w-3" /> Directions
                                </a>
                                <button
                                  type="button"
                                  onClick={() => startEdit(item)}
                                  className="inline-flex items-center gap-1 text-xs text-[#5C6B64] dark:text-[#A9AEA7] hover:text-[#183B35] dark:hover:text-[#F2EFE8]"
                                >
                                  <Pencil className="h-3 w-3" /> Replace
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onRemove?.(item)}
                                  className="inline-flex items-center gap-1 text-xs text-[#B14646] hover:text-[#DD7070]"
                                >
                                  <X className="h-3 w-3" /> Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}

export default ItineraryTimeline
