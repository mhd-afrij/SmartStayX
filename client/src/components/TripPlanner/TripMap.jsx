import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useAppContext } from '../../context/AppContext'

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
const zoom = 3

const destinationCoords = {
  Paris: [48.8566, 2.3522],
  London: [51.5074, -0.1278],
  Rome: [41.9028, 12.4964],
  Santorini: [36.3932, 25.4615],
  Amsterdam: [52.3676, 4.9041],
  Tokyo: [35.6762, 139.6503],
  Kyoto: [35.0116, 135.7681],
  Bangkok: [13.7563, 100.5018],
  Bali: [-8.3405, 115.092],
  Seoul: [37.5665, 126.978],
  'New York': [40.7128, -74.006],
  Cancun: [21.1619, -86.8515],
  'Rio de Janeiro': [-22.9068, -43.1729],
  Marrakech: [31.6295, -7.9811],
  'Cape Town': [-33.9249, 18.4241],
  Sydney: [-33.8688, 151.2093],
}

const MapController = ({ coords }) => {
  const map = useMap()
  useEffect(() => {
    if (coords) {
      map.setView(coords, 12, { animate: true })
    }
  }, [coords, map])
  return null
}

const TripMap = ({ destination, hotels }) => {
  const { translate } = useAppContext()
  const [coords, setCoords] = useState(null)

  useEffect(() => {
    if (destination && destinationCoords[destination]) {
      setCoords(destinationCoords[destination])
    }
  }, [destination])

  if (typeof window === 'undefined') return null

  return (
    <div className='max-w-3xl mx-auto'>
      <div className='rounded-2xl overflow-hidden border border-white/[0.06] h-[300px] md:h-[400px]'>
        <MapContainer
          center={coords || defaultCenter}
          zoom={coords ? 12 : zoom}
          scrollWheelZoom={false}
          className='h-full w-full'
          style={{ background: '#0B1220' }}
        >
          <TileLayer
            url='https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          />
          {coords && <MapController coords={coords} />}
          {coords && (
            <Marker position={coords} icon={goldIcon}>
              <Popup>
                <span className='text-sm font-medium'>{destination}</span>
              </Popup>
            </Marker>
          )}
          {hotels?.slice(0, 5).map((hotel) => {
            const hc = hotel.coordinates
            if (!hc || !hc.lat || !hc.lng) return null
            return (
              <Marker key={hotel._id} position={[hc.lat, hc.lng]}>
                <Popup>
                  <span className='text-sm font-medium'>{hotel.name}</span>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>
    </div>
  )
}

export default TripMap
