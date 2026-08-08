// TripMap — Interactive Leaflet map showing trip destination and itinerary item pins
import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import destinationsData from '../../data/tripPlanner/destinationsData'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const goldIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const defaultCenter = [20, 0]
const defaultZoom = 2

const MapController = ({ coords }) => {
  const map = useMap()
  useEffect(() => {
    if (coords) map.setView(coords, 12, { animate: true })
  }, [coords, map])
  return null
}

const TripMap = ({ destination, items = [] }) => {
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    const match = destinationsData.find((d) => d.name === destination)
    setCoords(match ? match.coords : null)
  }, [destination])

  const pins = items.filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))

  return (
    <div className="rounded-2xl overflow-hidden border border-[#E2E8F0] h-[300px] md:h-full md:min-h-[400px]">
      <MapContainer
        center={coords || defaultCenter}
        zoom={coords ? 12 : defaultZoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {coords && <MapController coords={coords} />}
        {coords && (
          <Marker position={coords} icon={goldIcon}>
            <Popup><span className="text-sm font-medium">{destination}</span></Popup>
          </Marker>
        )}
        {pins.map((item) => (
          <Marker key={item._id || item.title} position={[item.lat, item.lng]}>
            <Popup>
              <span className="text-sm font-medium">{item.title}</span>
              {item.day && <div className="text-xs text-slate-500">Day {item.day}</div>}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

export default TripMap
