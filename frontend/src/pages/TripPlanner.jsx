// TripPlanner — AI-powered trip planning: preferences form, generated itinerary, and map
import { useState } from 'react'
import toast from 'react-hot-toast'
import {
  Compass, Download, Loader2, Map as MapIcon, Printer, RefreshCw, Save, Sparkles, Trash2, Copy, List,
} from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import { Button, Input, Select } from '../components/ui'
import { SkeletonCard, EmptyState, ErrorState } from '../components/ui/States'
import DestinationsGrid from '../components/TripPlanner/DestinationsGrid'
import ItineraryTimeline from '../components/TripPlanner/ItineraryTimeline'
import TripMap from '../components/TripPlanner/TripMap'

const INTERESTS = ['Beaches', 'Nature', 'Adventure', 'Culture', 'History', 'Food', 'Shopping', 'Nightlife', 'Relaxation', 'Family']

const emptyForm = {
  destination: '',
  startDate: '',
  endDate: '',
  travelers: 2,
  budget: '',
  interests: [],
  activityPreferences: '',
  transportPreference: 'any',
  foodPreference: 'any',
  travelPace: 'moderate',
  accessibilityRequirements: '',
}

const TripPlanner = () => {
  const { axios, translate } = useAppContext()
  const [form, setForm] = useState(emptyForm)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [itinerary, setItinerary] = useState(null)
  const [mobileTab, setMobileTab] = useState('itinerary')

  const updateField = (key, value) => setForm((f) => ({ ...f, [key]: value }))

  const toggleInterest = (interest) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }))
  }

  const generate = async (overrideTripId) => {
    if (!form.destination.trim()) {
      toast.error('Please choose a destination')
      return
    }
    setGenerating(true)
    setError(null)
    try {
      const { data } = await axios.post('/api/itinerary/generate', {
        ...form,
        tripId: overrideTripId || itinerary?.tripId,
      })
      if (data.success) {
        setItinerary(data.itinerary)
        toast.success('Itinerary generated')
      } else {
        setError(data.message || 'Could not generate itinerary')
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not generate itinerary')
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    generate()
  }

  const handleRegenerate = () => generate(itinerary?.tripId)

  const handleRemoveItem = async (item) => {
    if (!itinerary) return
    try {
      const { data } = await axios.delete(`/api/itinerary/${itinerary.tripId}/items/${item._id}`)
      if (data.success) {
        setItinerary(data.itinerary)
        toast.success('Item removed')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove item')
    }
  }

  const handleReplaceItem = async (item, updated) => {
    if (!itinerary) return
    try {
      await axios.post('/api/itinerary', {
        tripId: itinerary.tripId,
        title: updated.title,
        type: updated.type,
        day: item.day,
        address: updated.address,
        notes: updated.notes,
      })
      const { data } = await axios.delete(`/api/itinerary/${itinerary.tripId}/items/${item._id}`)
      if (data.success) {
        setItinerary(data.itinerary)
        toast.success('Item replaced')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not replace item')
    }
  }

  const handleSave = async () => {
    if (!itinerary) return
    toast.success('Trip saved to your account')
  }

  const handleDuplicate = async () => {
    if (!itinerary) return
    try {
      const { data } = await axios.post(`/api/itinerary/${itinerary.tripId}/duplicate`)
      if (data.success) {
        setItinerary(data.itinerary)
        toast.success('Trip duplicated')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not duplicate trip')
    }
  }

  const handleDelete = async () => {
    if (!itinerary) return
    try {
      const { data } = await axios.delete(`/api/itinerary/${itinerary.tripId}`)
      if (data.success) {
        setItinerary(null)
        setForm(emptyForm)
        toast.success('Trip deleted')
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete trip')
    }
  }

  const handleExport = () => {
    if (!itinerary) return
    const blob = new Blob([JSON.stringify(itinerary, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${itinerary.title || 'trip'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-[#F8FAFC] pt-24 pb-16 px-4 md:px-8 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <p className="luxury-kicker mb-2">AI Trip Planner</p>
          <h1 className="luxury-title text-3xl md:text-4xl">{translate('itinerary')}</h1>
          <p className="luxury-copy mt-2 max-w-2xl">
            Tell us where you want to go and we'll build a personalized day-by-day itinerary.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="luxury-card p-5 md:p-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Destination"
              required
              value={form.destination}
              onChange={(e) => updateField('destination', e.target.value)}
              placeholder="e.g. Paris"
            />
            <Input
              label="Number of travelers"
              type="number"
              min={1}
              value={form.travelers}
              onChange={(e) => updateField('travelers', Number(e.target.value) || 1)}
            />
            <Input
              label="Start date"
              type="date"
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
            />
            <Input
              label="End date"
              type="date"
              value={form.endDate}
              onChange={(e) => updateField('endDate', e.target.value)}
            />
            <Input
              label="Budget (per person)"
              value={form.budget}
              onChange={(e) => updateField('budget', e.target.value)}
              placeholder="e.g. $2000"
            />
            <Select
              label="Travel pace"
              value={form.travelPace}
              onChange={(e) => updateField('travelPace', e.target.value)}
            >
              <option value="relaxed">Relaxed</option>
              <option value="moderate">Moderate</option>
              <option value="packed">Packed</option>
            </Select>
            <Select
              label="Transport preference"
              value={form.transportPreference}
              onChange={(e) => updateField('transportPreference', e.target.value)}
            >
              <option value="any">Any</option>
              <option value="public">Public transport</option>
              <option value="walking">Walking</option>
              <option value="rental_car">Rental car</option>
              <option value="taxi">Taxi / rideshare</option>
            </Select>
            <Select
              label="Food preference"
              value={form.foodPreference}
              onChange={(e) => updateField('foodPreference', e.target.value)}
            >
              <option value="any">Any</option>
              <option value="local">Local cuisine</option>
              <option value="fine_dining">Fine dining</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="halal">Halal</option>
            </Select>
          </div>

          <div>
            <p className="block text-sm font-medium text-[#0F172A] mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    form.interests.includes(interest)
                      ? 'bg-[#2563EB] text-white border-[#2563EB]'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#2563EB]/40'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Activity preferences"
              value={form.activityPreferences}
              onChange={(e) => updateField('activityPreferences', e.target.value)}
              placeholder="e.g. museums, hiking, nightlife"
            />
            <Input
              label="Accessibility requirements"
              value={form.accessibilityRequirements}
              onChange={(e) => updateField('accessibilityRequirements', e.target.value)}
              placeholder="e.g. wheelchair accessible"
            />
          </div>

          <div>
            <p className="block text-sm font-medium text-[#0F172A] mb-2">Or pick a popular destination</p>
            <DestinationsGrid selected={form.destination} onSelect={(name) => updateField('destination', name)} />
          </div>

          <Button type="submit" icon={generating ? Loader2 : Sparkles} loading={generating} disabled={generating}>
            {generating ? 'Generating your itinerary...' : 'Generate Itinerary'}
          </Button>
        </form>

        <div className="mt-10">
          {generating && !itinerary && (
            <div className="grid md:grid-cols-2 gap-4">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          )}

          {error && !generating && (
            <ErrorState description={error} onRetry={handleRegenerate} />
          )}

          {!generating && !error && !itinerary && (
            <EmptyState
              icon={Compass}
              title="No trip planned yet"
              description="Fill in your preferences above and generate a personalized itinerary."
            />
          )}

          {itinerary && (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-xl font-playfair font-bold text-[#0F172A]">{itinerary.title}</h2>
                  <p className="text-sm text-[#64748B]">{itinerary.destination}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" icon={Save} onClick={handleSave}>Save</Button>
                  <Button variant="outline" size="sm" icon={RefreshCw} loading={generating} onClick={handleRegenerate}>Regenerate</Button>
                  <Button variant="outline" size="sm" icon={Copy} onClick={handleDuplicate}>Duplicate</Button>
                  <Button variant="outline" size="sm" icon={Download} onClick={handleExport}>Export</Button>
                  <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>Print</Button>
                  <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete}>Delete</Button>
                </div>
              </div>

              <div className="md:hidden flex gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setMobileTab('itinerary')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-medium ${mobileTab === 'itinerary' ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}
                >
                  <List className="h-4 w-4" /> Itinerary
                </button>
                <button
                  type="button"
                  onClick={() => setMobileTab('map')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] text-sm font-medium ${mobileTab === 'map' ? 'bg-[#2563EB] text-white' : 'bg-white border border-[#E2E8F0] text-[#64748B]'}`}
                >
                  <MapIcon className="h-4 w-4" /> Map
                </button>
              </div>

              <div className="grid md:grid-cols-[1.4fr_1fr] gap-6">
                <div className={mobileTab === 'itinerary' ? 'block' : 'hidden md:block'}>
                  <ItineraryTimeline items={itinerary.items} onRemove={handleRemoveItem} onReplace={handleReplaceItem} />
                </div>
                <div className={`${mobileTab === 'map' ? 'block' : 'hidden md:block'} md:sticky md:top-24 md:self-start`}>
                  <TripMap destination={itinerary.destination} items={itinerary.items} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TripPlanner
