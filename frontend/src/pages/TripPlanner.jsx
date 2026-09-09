// TripPlanner — Premium hotel concierge trip planning.
// The existing hotel is the automatic starting point; guests/staff discover
// nearby places, search destinations, click the map, and compose an ordered
// route with real road distances/ETAs and a live trip summary.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { FolderOpen, Loader2, Map as MapIcon, Route as RouteIcon, Sun } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import tripPlannerService from "../services/TripPlannerService";
import { decodePolyline, buildEtaChain, haversineKm } from "../utils/tripGeo";
import TripMap from "../components/TripPlanner/TripMap";
import RoutePanel from "../components/TripPlanner/RoutePanel";
import PlaceSearch from "../components/TripPlanner/PlaceSearch";
import NearbyPlaces from "../components/TripPlanner/NearbyPlaces";
import LocationCard from "../components/TripPlanner/LocationCard";
import SavedTrips from "../components/TripPlanner/SavedTrips";

let stopKeyCounter = 0;
const nextStopKey = () => {
  stopKeyCounter += 1;
  return `stop-${stopKeyCounter}`;
};

const TripPlanner = () => {
  const { axios } = useAppContext();

  // ── Hotel start location ───────────────────────────────────────────────
  const [hotel, setHotel] = useState(null);
  const [hotelLoading, setHotelLoading] = useState(true);
  const [hotelError, setHotelError] = useState("");

  // ── Trip state ─────────────────────────────────────────────────────────
  const [stops, setStops] = useState([]);
  const [departureTime, setDepartureTime] = useState("09:00");
  const [route, setRoute] = useState(null); // { legs, overviewPolyline }
  const [calculating, setCalculating] = useState(false);
  const [routeError, setRouteError] = useState("");

  // ── Selection / popup ──────────────────────────────────────────────────
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [resolving, setResolving] = useState(false);

  // ── Saved trips ────────────────────────────────────────────────────────
  const [savedOpen, setSavedOpen] = useState(false);
  const [savedTrips, setSavedTrips] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savingTrip, setSavingTrip] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);

  const routeSeqRef = useRef(0);

  // ── Load hotel location ────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await tripPlannerService.getHotelLocation(axios);
        if (cancelled) return;
        if (data.startLocation) {
          setHotel({
            id: data.hotel?._id || null,
            name: data.startLocation.name,
            address: data.startLocation.address,
            lat: data.startLocation.lat,
            lng: data.startLocation.lng,
            locationComplete: true,
          });
        } else {
          setHotel({
            id: data.hotel?._id || null,
            name: data.hotel?.name || null,
            address: [data.hotel?.address, data.hotel?.city, data.hotel?.country]
              .filter(Boolean)
              .join(", "),
            lat: null,
            lng: null,
            locationComplete: false,
          });
          setHotelError(data.message || "Hotel location is incomplete.");
        }
      } catch (err) {
        if (!cancelled) setHotelError(err.message || "Unable to load the hotel location.");
      } finally {
        if (!cancelled) setHotelLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [axios]);

  // ── Route calculation (only when the point set actually changes) ───────
  const routeKey = useMemo(
    () => stops.map((s) => `${s.lat.toFixed(6)},${s.lng.toFixed(6)}`).join("|"),
    [stops]
  );

  useEffect(() => {
    if (!hotel?.locationComplete) return undefined;
    if (stops.length === 0) {
      // Reset synchronously via a microtask so we never setState in the effect body.
      const reset = Promise.resolve().then(() => {
        setRoute(null);
        setRouteError("");
        setCalculating(false);
      });
      return () => {
        routeSeqRef.current += 1;
        void reset;
      };
    }
    const seq = (routeSeqRef.current += 1);

    const run = async () => {
      setCalculating(true);
      setRouteError("");
      try {
        const origin = { lat: hotel.lat, lng: hotel.lng };
        const waypoints = stops.slice(0, -1).map((s) => ({ lat: s.lat, lng: s.lng }));
        const destination = stops[stops.length - 1];
        const data = await tripPlannerService.getDirections(axios, origin, waypoints, destination);
        if (routeSeqRef.current !== seq) return; // stale response
        setRoute({ legs: data.route.legs, overviewPolyline: data.route.overviewPolyline });
      } catch (err) {
        if (routeSeqRef.current !== seq) return;
        setRoute(null);
        setRouteError(
          err.message === "No route is available between these locations."
            ? err.message
            : "Unable to calculate this route."
        );
      } finally {
        if (routeSeqRef.current === seq) setCalculating(false);
      }
    };

    run();

    return () => {
      routeSeqRef.current += 1; // invalidate in-flight responses on change
    };
  }, [routeKey, hotel?.locationComplete, axios]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── ETA chain (pure, derived) ──────────────────────────────────────────
  const eta = useMemo(() => {
    if (!hotel?.locationComplete || stops.length === 0) return null;
    const points = [
      { lat: hotel.lat, lng: hotel.lng, name: hotel.name },
      ...stops.map((s) => ({ lat: s.lat, lng: s.lng, name: s.name })),
    ];
    const legs = route?.legs || null;
    // Fall back to haversine estimates while the road route loads (or if it failed).
    return buildEtaChain(
      points,
      legs,
      stops.map((s) => Number(s.stopDuration) || 0),
      departureTime
    );
  }, [hotel, stops, route, departureTime]);

  // ── Stop management ────────────────────────────────────────────────────
  const addStop = useCallback(
    (place) => {
      if (!hotel?.locationComplete) {
        toast.error("Set your hotel location first.");
        return;
      }
      const lat = Number(place.lat);
      const lng = Number(place.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        toast.error("Unable to find this location.");
        return;
      }
      // Prevent duplicates by proximity (~10m) or matching place id.
      const duplicate = stops.some(
        (s) =>
          (place.placeId && s.placeId && s.placeId === place.placeId) ||
          haversineKm(s, { lat, lng }) < 0.01
      );
      if (duplicate) {
        toast.error("This place is already in your trip.");
        return;
      }
      setStops((prev) => [
        ...prev,
        {
          key: nextStopKey(),
          placeId: place.placeId || "",
          name: place.name || "Selected location",
          address: place.address || "",
          category: place.category || place.types?.[0] || "",
          lat,
          lng,
          stopDuration: 0,
          photoUrl: place.photoUrl || "",
          rating: place.rating || 0,
          markerColor: place.markerColor,
        },
      ]);
      setSelectedPlace(null);
      toast.success("Added to trip");
    },
    [hotel, stops]
  );

  const removeStop = useCallback((index) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    setSelectedPlace(null);
  }, []);

  const reorderStops = useCallback((from, to) => {
    setStops((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const setStopDuration = useCallback((index, minutes) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, stopDuration: minutes } : s)));
  }, []);

  // ── Map click → reverse geocode → location card ────────────────────────
  const handleMapClick = useCallback(
    async ({ lat, lng }) => {
      setSelectedPlace({ lat, lng, name: "", address: "Resolving address…", loading: true });
      setResolving(true);
      try {
        const data = await tripPlannerService.reverseGeocode(axios, lat, lng);
        setSelectedPlace({
          lat,
          lng,
          name: "",
          address: data.address || "Unnamed location",
          category: "",
          distanceKm: hotel?.locationComplete ? haversineKm(hotel, { lat, lng }) : undefined,
          loading: false,
        });
      } catch {
        setSelectedPlace({
          lat,
          lng,
          name: "",
          address: "Unnamed location",
          category: "",
          distanceKm: hotel?.locationComplete ? haversineKm(hotel, { lat, lng }) : undefined,
          loading: false,
        });
      } setResolving(false);
    },
    [axios, hotel]
  );

  // Clicking a place from search/nearby/map markers: enrich with straight-line
  // distance from the hotel, then open the location card. The hotel marker is
  // informational only — it can never be added as a stop.
  const handleSelectListedPlace = useCallback(
    (place) => {
      if (place?.isHotel) {
        setSelectedPlace({ ...place, distanceKm: 0 });
        return;
      }
      const enriched = {
        ...place,
        distanceKm: hotel?.locationComplete && Number.isFinite(place.lat)
          ? haversineKm(hotel, place)
          : undefined,
      };
      setSelectedPlace(enriched);
    },
    [hotel]
  );

  const selectedIsInTrip = useMemo(
    () =>
      selectedPlace &&
      stops.some(
        (s) =>
          (selectedPlace.placeId && s.placeId && s.placeId === selectedPlace.placeId) ||
          (Number.isFinite(selectedPlace.lat) &&
            haversineKm(s, selectedPlace) < 0.01)
      ),
    [selectedPlace, stops]
  );

  // ── Saved trips ────────────────────────────────────────────────────────
  const openSaved = useCallback(async () => {
    setSavedOpen(true);
    setSavedLoading(true);
    try {
      const data = await tripPlannerService.getTrips(axios);
      setSavedTrips(data.trips || []);
    } catch (err) {
      toast.error(err.message || "Unable to load trips.");
    } finally {
      setSavedLoading(false);
    }
  }, [axios]);

  const saveTrip = useCallback(async () => {
    if (!hotel?.locationComplete || stops.length === 0) return;
    const name = window.prompt("Trip name", `Trip from ${hotel.name || "hotel"} — ${new Date().toLocaleDateString()}`);
    if (name == null) return;
    if (!name.trim()) {
      toast.error("Trip name is required");
      return;
    }
    setSavingTrip(true);
    try {
      const payload = {
        name: name.trim(),
        stops: stops.map((s) => ({
          placeId: s.placeId,
          name: s.name,
          address: s.address,
          category: s.category,
          lat: s.lat,
          lng: s.lng,
          stopDuration: Number(s.stopDuration) || 0,
          photoUrl: s.photoUrl || "",
          rating: s.rating || 0,
        })),
        totalDistanceKm: eta?.totals?.distanceKm ?? 0,
        totalDurationMin: eta?.totals?.durationMin ?? 0,
      };
      if (activeTripId) {
        await tripPlannerService.updateTrip(axios, activeTripId, payload);
        toast.success("Trip updated");
      } else {
        const data = await tripPlannerService.createTrip(axios, payload);
        setActiveTripId(data.trip?._id || null);
        toast.success("Trip saved");
      }
    } catch (err) {
      toast.error(err.message || "Unable to save the trip.");
    } finally {
      setSavingTrip(false);
    }
  }, [axios, hotel, stops, eta, activeTripId]);

  const loadSavedTrip = useCallback(
    (trip) => {
      setStops(
        (trip.stops || []).map((s) => ({
          key: nextStopKey(),
          placeId: s.placeId || "",
          name: s.name,
          address: s.address || "",
          category: s.category || "",
          lat: s.lat,
          lng: s.lng,
          stopDuration: s.stopDuration || 0,
          photoUrl: s.photoUrl || "",
          rating: s.rating || 0,
        }))
      );
      setActiveTripId(trip._id);
      setSavedOpen(false);
      toast.success(`Loaded "${trip.name}"`);
    },
    []
  );

  const deleteSavedTrip = useCallback(
    async (trip) => {
      try {
        await tripPlannerService.deleteTrip(axios, trip._id);
        setSavedTrips((prev) => prev.filter((t) => t._id !== trip._id));
        if (activeTripId === trip._id) setActiveTripId(null);
        toast.success("Trip deleted");
      } catch (err) {
        toast.error(err.message || "Unable to delete the trip.");
      }
    },
    [axios, activeTripId]
  );

  // ── Derived state for children ─────────────────────────────────────────
  const stopsForMap = useMemo(
    () =>
      stops.map((s, i) => ({
        ...s,
        markerColor: s.markerColor || "#183B35",
        index: i,
      })),
    [stops]
  );

  const routePolyline = useMemo(
    () => decodePolyline(route?.overviewPolyline || ""),
    [route]
  );

  // ── Render ─────────────────────────────────────────────────────────────
  if (hotelLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-7 w-7 animate-spin text-[#A67C52]" />
          <p className="text-sm text-[#5C6B64] dark:text-[#A9AEA7]">Loading map…</p>
        </div>
      </div>
    );
  }

  if (!hotel || !hotel.locationComplete) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F7F5F0] px-4 dark:bg-[#111412]">
        <div className="luxury-card max-w-md p-8 text-center">
          <MapIcon className="mx-auto h-8 w-8 text-[#A67C52]" />
          <h1 className="mt-3 text-lg font-semibold text-[#202522] dark:text-[#F2EFE8]">
            Hotel location is incomplete
          </h1>
          <p className="mt-2 text-sm text-[#5C6B64] dark:text-[#A9AEA7]">
            {hotelError ||
              "Add latitude and longitude for your hotel in Hotel Management to start planning trips."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#111412] pt-20 pb-10">
      <div className="mx-auto max-w-[1600px] px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="luxury-kicker mb-1">Concierge</p>
            <h1 className="luxury-title text-3xl md:text-4xl !leading-[1.05]">Trip Planner</h1>
            <p className="luxury-copy mt-1.5 max-w-xl text-sm">
              Plan day trips from {hotel.name} — explore nearby places, search destinations, and build your route.
            </p>
          </div>
          <button
            type="button"
            onClick={openSaved}
            className="ghost-button px-4 py-2.5 text-xs"
          >
            <FolderOpen className="h-4 w-4" /> Saved Trips
          </button>
        </div>

        {/* Desktop: route panel + map. Mobile: map, then scrollable panel. */}
        <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
          {/* Route panel column */}
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            <div className="luxury-card p-4">
              <h2 className="mb-3 text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">Find places</h2>
              <PlaceSearch
                axios={axios}
                hotel={hotel}
                onAdd={addStop}
                disabled={!hotel.locationComplete}
              />
              <div className="my-3 border-t border-[#E3E0D8] dark:border-[#303631]" />
              <NearbyPlaces
                axios={axios}
                hotel={hotel}
                onAdd={addStop}
                disabled={!hotel.locationComplete}
              />
            </div>

            <div className="lg:max-h-[calc(100vh-320px)] lg:overflow-y-auto">
              <RoutePanel
                hotel={hotel}
                stops={stops}
                eta={eta}
                departureTime={departureTime}
                onDepartureChange={setDepartureTime}
                onStopDurationChange={setStopDuration}
                onRemoveStop={removeStop}
                onReorder={reorderStops}
                onFocusStop={(stop) => setSelectedPlace({ ...stop, isStop: true })}
                routeError={routeError}
                calculating={calculating}
                onSave={saveTrip}
                saving={savingTrip}
                saveDisabled={savingTrip}
              />
            </div>
          </div>

          {/* Map column */}
          <div className="order-1 lg:order-2">
            <div className="relative h-[420px] overflow-hidden rounded-2xl border border-[#E3E0D8] shadow-[var(--shadow-md)] md:h-[560px] lg:h-[calc(100vh-190px)] dark:border-[#303631]">
              <TripMap
                hotel={hotel}
                stops={stopsForMap}
                routePolyline={routePolyline}
                selectedPlace={selectedPlace}
                onSelectPlace={handleSelectListedPlace}
                onMapClick={handleMapClick}
                routeError={Boolean(routeError)}
              />

              {/* Floating quick add hint */}
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-[500] -translate-x-1/2 rounded-full bg-white/90 px-3.5 py-1.5 text-[11px] font-medium text-[#5C6B64] shadow-sm backdrop-blur dark:bg-[#1A1E1B]/90 dark:text-[#A9AEA7]">
                <RouteIcon className="mr-1 inline h-3 w-3" />
                Click the map to add any location
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Location popup (desktop card / mobile bottom sheet) */}
      <LocationCard
        place={selectedPlace}
        added={selectedIsInTrip}
        busy={resolving}
        onClose={() => setSelectedPlace(null)}
        onAdd={() => {
          if (selectedIsInTrip || selectedPlace?.isHotel) {
            setSelectedPlace(null);
            return;
          }
          addStop(selectedPlace);
        }}
        onRemove={() => {
          const idx = stops.findIndex(
            (s) =>
              (selectedPlace?.placeId && s.placeId === selectedPlace.placeId) ||
              haversineKm(s, selectedPlace) < 0.01
          );
          if (idx >= 0) removeStop(idx);
        }}
      />

      {/* Saved trips drawer */}
      <SavedTrips
        open={savedOpen}
        trips={savedTrips}
        loading={savedLoading}
        onClose={() => setSavedOpen(false)}
        onLoad={loadSavedTrip}
        onDelete={deleteSavedTrip}
      />
    </div>
  );
};

export default TripPlanner;
