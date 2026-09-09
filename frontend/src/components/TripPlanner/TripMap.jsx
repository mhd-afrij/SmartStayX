// TripMap — Interactive Leaflet map for the Trip Planner.
// Hotel marker (start), numbered stop markers, road-route polyline, click-to-add,
// reverse-geocode popup for empty map points, and fit-bounds to the whole route.
import { useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Marker icons ──────────────────────────────────────────────────────────────
const buildIcon = (label, color, size = 34) =>
  L.divIcon({
    className: "trip-marker",
    html: `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};color:#fff;font-weight:700;font-size:${size >= 34 ? 13 : 12}px;border:2px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.35);white-space:nowrap;">${label}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

const hotelIcon = buildIcon("🏨", "#183B35", 38);
const finishIcon = buildIcon("🏁", "#A67C52", 38);
const numberedIcon = (n, color) => buildIcon(n, color, 32);

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (event) => onMapClick?.({ lat: event.latlng.lat, lng: event.latlng.lng }),
  });
  return null;
};

// Fits the viewport to the hotel + all stops + route; keeps the hotel centered
// alone when no stops exist. Re-fits only when the point set actually changes.
const FitController = ({ points, polylineCoords }) => {
  const map = useMap();
  const fitKey = points.map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`).join("|");

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    if (polylineCoords.length > 1) {
      polylineCoords.forEach(([lat, lng]) => bounds.extend([lat, lng]));
    }
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey, map]);

  return null;
};

// Keeps Leaflet's internal size in sync when the container resizes
// (desktop panel collapse, mobile bottom-sheet drag, orientation change).
const ResizeHandler = () => {
  const map = useMap();
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize({ animate: false }));
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);
  return null;
};

const TripMap = ({
  hotel,
  stops = [],
  routePolyline = [],
  selectedPlace = null,
  onSelectPlace = () => {},
  onMapClick = () => {},
  routeError = false,
}) => {
  const mapRef = useRef(null);

  // Points currently drawn: hotel + ordered stops.
  const points = useMemo(() => {
    const list = [];
    if (hotel?.lat != null && hotel?.lng != null) {
      list.push({ name: hotel.name, lat: hotel.lat, lng: hotel.lng });
    }
    stops.forEach((s) => {
      if (Number.isFinite(s.lat) && Number.isFinite(s.lng)) list.push(s);
    });
    return list;
  }, [hotel, stops]);

  const handleStopClick = (stop) => onSelectPlace({ ...stop, isStop: true, stopRef: stop });

  return (
    <MapContainer
      center={[hotel?.lat ?? 6.9271, hotel?.lng ?? 79.8612]}
      zoom={13}
      scrollWheelZoom
      className="h-full w-full trip-map"
      attributionControl
      ref={(instance) => {
        mapRef.current = instance;
      }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <ResizeHandler />
      <FitController points={points} polylineCoords={routePolyline} />
      <MapClickHandler onMapClick={onMapClick} />

      {/* Road route */}
      {routePolyline.length > 1 && (
        <>
          {/* Casing for contrast in both themes */}
          <Polyline positions={routePolyline} pathOptions={{ color: "#ffffff", weight: 8, opacity: 0.7 }} />
          <Polyline
            positions={routePolyline}
            pathOptions={{ color: routeError ? "#B14646" : "#183B35", weight: 4, opacity: 0.95 }}
          />
        </>
      )}

      {/* Hotel marker — never removable from the map */}
      {hotel?.lat != null && hotel?.lng != null && (
        <Marker
          position={[hotel.lat, hotel.lng]}
          icon={hotelIcon}
          eventHandlers={{ click: () => onSelectPlace({ ...hotel, isHotel: true }) }}
        >
          <Popup>
            <div className="text-sm font-semibold">{hotel.name}</div>
            <div className="text-xs opacity-70">{hotel.address}</div>
            <div className="mt-1 text-xs opacity-70">
              {Number(hotel.lat).toFixed(5)}, {Number(hotel.lng).toFixed(5)}
            </div>
            <div className="mt-1 text-xs font-medium">Starting point</div>
          </Popup>
        </Marker>
      )}

      {/* Numbered stop markers; final stop gets the finish flag */}
      {stops.map((stop, index) => {
        const isLast = index === stops.length - 1 && stops.length > 0;
        const icon = isLast ? finishIcon : numberedIcon(String(index + 1).padStart(2, "0"), stop.markerColor || "#183B35");
        return (
          <Marker
            key={`${stop.placeId || stop.name}-${index}-${stop.lat}-${stop.lng}`}
            position={[stop.lat, stop.lng]}
            icon={icon}
            eventHandlers={{ click: () => handleStopClick(stop) }}
          >
            <Popup>
              <div className="text-sm font-semibold">
                {isLast ? "🏁 " : ""}
                {String(index + 1).padStart(2, "0")} · {stop.name}
              </div>
              {stop.address && <div className="text-xs opacity-70">{stop.address}</div>}
            </Popup>
          </Marker>
        );
      })}

      {/* Transient selection highlight for searched/nearby place preview */}
      {selectedPlace && Number.isFinite(selectedPlace.lat) && Number.isFinite(selectedPlace.lng) && !selectedPlace.isStop && (
        <Marker
          position={[selectedPlace.lat, selectedPlace.lng]}
          icon={buildIcon("📍", "#A67C52", 30)}
          eventHandlers={{ click: () => onSelectPlace(selectedPlace) }}
        />
      )}
    </MapContainer>
  );
};

export default TripMap;
