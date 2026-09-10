// TripPlanner — Multi-country Google Maps trip planner. All origins are
// database-anchored on the selected hotel (the backend enforces staff hotel
// scope). The live map uses the browser-scoped VITE_GOOGLE_MAPS_API_KEY; the
// backend never exposes its server key.
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppContext } from "../context/AppContext";
import useGoogleMaps from "../hooks/useGoogleMaps";
import TripPlannerService from "../services/TripPlannerService";
import { loadFavorites, saveFavorites, toggleFavorite, isFavorite } from "../utils/tripPlannerFavorites";
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  Star,
  Heart,
  X,
  Landmark,
  UtensilsCrossed,
  ShoppingBag,
  Plane,
  Hospital,
  TreePine,
  Umbrella,
  Theater,
  Bus,
  Car,
  Footprints,
  Bike,
  TrainFront,
  Compass,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = [
  { key: "attractions", label: "Attractions", icon: Landmark },
  { key: "restaurants", label: "Restaurants", icon: UtensilsCrossed },
  { key: "shopping", label: "Shopping", icon: ShoppingBag },
  { key: "airports", label: "Airports", icon: Plane },
  { key: "hospitals", label: "Hospitals", icon: Hospital },
  { key: "parks", label: "Parks", icon: TreePine },
  { key: "beaches", label: "Beaches", icon: Umbrella },
  { key: "museums", label: "Museums", icon: Landmark },
  { key: "entertainment", label: "Entertainment", icon: Theater },
  { key: "transport", label: "Transport", icon: Bus },
];

const TRAVEL_MODES = [
  { key: "DRIVE", label: "Drive", icon: Car },
  { key: "WALK", label: "Walk", icon: Footprints },
  { key: "BICYCLE", label: "Bike", icon: Bike },
  { key: "TRANSIT", label: "Transit", icon: TrainFront },
];

const SEARCH_RADII = [
  { value: 5000, label: "5 km" },
  { value: 10000, label: "10 km" },
  { value: 15000, label: "15 km" },
  { value: 30000, label: "30 km" },
];

const POPULAR_SEARCHES = [
  "Eiffel Tower",
  "Burj Khalifa",
  "Marina Bay Sands",
  "Times Square",
  "Wat Arun",
  "Bali beach",
];

const PRIMARY = "#183B35";
const PRIMARY_DARK = "#8FB8A8";

const TripPlanner = () => {
  const { user, userLoaded, navigate, translate } = useAppContext();
  const { isLoaded: mapsLoaded, error: mapsError, load: loadMaps } = useGoogleMaps();

  const [contextLoading, setContextLoading] = useState(true);
  const [contextError, setContextError] = useState("");
  const [hotels, setHotels] = useState([]);
  const [activeHotelId, setActiveHotelId] = useState(null);
  const [countryFilter, setCountryFilter] = useState("");

  const [activeTab, setActiveTab] = useState("discover");
  const [category, setCategory] = useState("attractions");
  const [radius, setRadius] = useState(10000);
  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState("");
  const [placesMessage, setPlacesMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [travelProfile, setTravelProfile] = useState(() => {
    try {
      return localStorage.getItem("tripPlannerProfile") || "";
    } catch {
      return "";
    }
  });

  const [destination, setDestination] = useState(null);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState("");
  const [travelMode, setTravelMode] = useState("DRIVE");

  const [favorites, setFavorites] = useState(() => loadFavorites(user?._id || user?.id || "anon"));

  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const infoWinRef = useRef(null);
  const hotelMarkerRef = useRef(null);
  const placeMarkersRef = useRef([]);
  const destMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const requestIdRef = useRef(0);
  const autoLoadedRef = useRef("");

  const userId = user?._id || user?.id || "anon";

  const handleToggleFavorite = (place) => {
    setFavorites((prev) => {
      const next = toggleFavorite(prev, place);
      saveFavorites(userId, next);
      return next;
    });
  };

  // ── Context bootstrap ───────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      setContextLoading(true);
      try {
        let savedId = null;
        try {
          savedId = localStorage.getItem("tripPlannerHotelId") || null;
        } catch {
          /* storage unavailable — start unselected */
        }
        const data = await TripPlannerService.getContext(savedId || undefined);
        if (cancelled) return;
        setHotels(data.hotels || []);
        setCountryFilter("");
        const picked = data.hotel?._id || null;
        setActiveHotelId(picked);
        if (picked) {
          try {
            localStorage.setItem("tripPlannerHotelId", picked);
          } catch {
            /* storage unavailable — ignore */
          }
        }
      } catch (error) {
        if (!cancelled) setContextError(error.message);
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    };
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const activeHotel = useMemo(
    () => hotels.find((h) => h._id === activeHotelId) || null,
    [hotels, activeHotelId]
  );
  const activeLocation = activeHotel?.location || null;
  const hotelKey = activeHotel ? `${activeHotel._id}` : "";

  const visibleHotels = useMemo(() => {
    if (!countryFilter) return hotels;
    return hotels.filter((h) => h.country === countryFilter);
  }, [hotels, countryFilter]);

  // ── Map lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    loadMaps();
  }, [loadMaps]);

  const initMap = (loc) => {
    const g = window.google.maps;
    const position = { lat: loc.latitude, lng: loc.longitude };
    mapRef.current = new g.Map(mapElRef.current, {
      center: position,
      zoom: 14,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false,
    });
    infoWinRef.current = new g.InfoWindow();

    hotelMarkerRef.current = new g.Marker({
      map: mapRef.current,
      position,
      title: activeHotel?.name || "Hotel",
      icon: { path: g.SymbolPath.CIRCLE, scale: 10, fillColor: PRIMARY, fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
    });
    const info = infoWinRef.current;
    hotelMarkerRef.current.addListener("click", () => {
      info.setContent(
        `<div style="font-family:inherit;padding:4px 2px;"><strong>${activeHotel?.name || "Hotel"}</strong><br/><span style="color:#666;">${activeHotel?.address || ""}, ${activeHotel?.city || ""}</span></div>`
      );
      info.open(mapRef.current, hotelMarkerRef.current);
    });

    drawPlaces();
    drawDestination();
    drawRoute();
  };

  const clearMapOverlays = (keepHotel = true) => {
    placeMarkersRef.current.forEach((m) => m?.setMap && m.setMap(null));
    placeMarkersRef.current = [];
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (!keepHotel && hotelMarkerRef.current) {
      hotelMarkerRef.current.setMap(null);
      hotelMarkerRef.current = null;
    }
  };

  const drawPlaces = () => {
    const g = window.google.maps;
    placeMarkersRef.current.forEach((m) => m.setMap(null));
    placeMarkersRef.current = [];
    if (!mapRef.current) return;
    places.forEach((p) => {
      if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) return;
      const marker = new g.Marker({
        map: mapRef.current,
        position: { lat: p.lat, lng: p.lng },
        title: p.name,
      });
      marker.addListener("click", () => {
        infoWinRef.current.setContent(
          `<div style="font-family:inherit;padding:4px 2px;max-width:220px;"><strong>${p.name}</strong><br/><span style="color:#666;">${p.address}</span><br/><span style="color:#B8860B;">${p.rating ? "★ " + p.rating : ""}</span></div>`
        );
        infoWinRef.current.open(mapRef.current, marker);
      });
      placeMarkersRef.current.push(marker);
    });
  };

  const drawDestination = () => {
    const g = window.google.maps;
    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }
    if (!mapRef.current || !destination) return;
    destMarkerRef.current = new g.Marker({
      map: mapRef.current,
      position: { lat: destination.lat, lng: destination.lng },
      title: destination.name,
      icon: { path: g.SymbolPath.CIRCLE, scale: 9, fillColor: "#B8860B", fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2 },
    });
  };

  const drawRoute = () => {
    const g = window.google.maps;
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }
    if (!mapRef.current || !route?.polyline) return;
    const path = g.geometry.encoding.decodePath(route.polyline);
    polylineRef.current = new g.Polyline({
      map: mapRef.current,
      path,
      strokeColor: PRIMARY_DARK,
      strokeOpacity: 1,
      strokeWeight: 6,
    });
    const bounds = new g.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    mapRef.current.fitBounds(bounds);
  };

  // Initialize the map whenever the Maps API loads or the selected hotel's
  // coordinates change. Declared after initMap/clearMapOverlays so effects
  // never reference a binding before it exists.
  useEffect(() => {
    if (!mapsLoaded || !mapElRef.current) return;
    if (!activeLocation) {
      clearMapOverlays(false);
      return;
    }
    initMap(activeLocation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, hotelKey, activeLocation]);

  // Secondary effects (run after effect ordering; safe because they no-op
  // without a map or markers glide over stale fragments of the previous hotel).
  useEffect(() => {
    if (mapsLoaded && mapRef.current) drawPlaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, places]);

  useEffect(() => {
    if (mapsLoaded && mapRef.current) drawDestination();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, destination]);

  useEffect(() => {
    if (mapsLoaded && mapRef.current) drawRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsLoaded, route]);

  // ── Hotel switching ────────────────────────────────────────────────────
  const handleHotelSwitch = (hotelId) => {
    if (String(hotelId) === String(activeHotelId)) return;
    setActiveHotelId(hotelId);
    try {
      localStorage.setItem("tripPlannerHotelId", hotelId);
    } catch {
      /* storage unavailable — non-fatal */
    }
    setPlaces([]);
    setPlacesError("");
    setPlacesMessage("");
    setSearchQuery("");
    setDestination(null);
    setRoute(null);
    setRouteError("");
    autoLoadedRef.current = `idle:${hotelId}`;
    setActiveTab("discover");
    if (mapRef.current && window.google?.maps) {
      clearMapOverlays(true);
      const h = hotels.find((x) => String(x._id) === String(hotelId));
      if (h?.location) initMap(h.location);
    }
  };

  const handleCountryFilter = (country) => {
    setCountryFilter(country);
    const pool = country ? hotels.filter((h) => h.country === country) : hotels;
    if (pool.length) handleHotelSwitch(pool[0]._id);
  };

  // ── Discover ───────────────────────────────────────────────────────────
  const loadNearby = async (cat = category, rad = radius) => {
    if (!activeHotelId) return;
    const pin = ++requestIdRef.current;
    setPlacesLoading(true);
    setPlacesError("");
    setPlacesMessage("");
    setPlaces([]);
    try {
      const res = await TripPlannerService.getNearby({ hotelId: activeHotelId, category: cat, radius: rad });
      if (pin !== requestIdRef.current) return;
      setPlaces(res.places || []);
      if (!res.places?.length) setPlacesMessage("No places found nearby. Try a wider radius or a different category.");
    } catch (error) {
      if (pin !== requestIdRef.current) return;
      setPlacesError(error.message);
      setPlaces([]);
    } finally {
      if (pin === requestIdRef.current) setPlacesLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!activeHotelId || !searchQuery.trim()) return;
    const pin = ++requestIdRef.current;
    setSearching(true);
    setPlacesError("");
    setPlacesMessage("");
    setPlaces([]);
    const profileHint = travelProfile.trim();
    const query = profileHint ? `${profileHint} ${searchQuery.trim()}` : searchQuery.trim();
    try {
      const res = await TripPlannerService.search({ hotelId: activeHotelId, query });
      if (pin !== requestIdRef.current) return;
      setPlaces(res.places || []);
      if (!res.places?.length) setPlacesMessage("No matches found. Try a different name or travel profile.");
    } catch (error) {
      if (pin !== requestIdRef.current) return;
      setPlacesError(error.message);
      setPlaces([]);
    } finally {
      if (pin === requestIdRef.current) setSearching(false);
    }
  };

  // Auto-load a sensible starting category once per hotel so the map is never
  // empty, unless geocoding hasn't provided coordinates yet.
  useEffect(() => {
    if (!activeHotel || !activeLocation) return;
    if (autoLoadedRef.current === `attractions:${hotelKey}`) return;
    autoLoadedRef.current = `attractions:${hotelKey}`;
    setCategory("attractions");
    const pin = ++requestIdRef.current;
    setPlacesLoading(true);
    setPlaces([]);
    TripPlannerService.getNearby({ hotelId: activeHotelId, category: "attractions", radius })
      .then((res) => {
        if (pin !== requestIdRef.current) return;
        setPlaces(res.places || []);
        setPlacesMessage(res.places?.length ? "" : "No places found nearby. Try a wider radius or a different category.");
      })
      .catch((error) => {
        if (pin !== requestIdRef.current) return;
        setPlacesError(error.message);
      })
      .finally(() => {
        if (pin === requestIdRef.current) setPlacesLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelKey, activeLocation]);

  const pickPlace = (place) => {
    setDestination({
      placeId: place.placeId,
      name: place.name,
      lat: place.lat,
      lng: place.lng,
    });
    setRoute(null);
    setRouteError("");
  };

  // ── Route building ─────────────────────────────────────────────────────
  const buildRoute = async () => {
    if (!activeHotelId || !destination) return;
    const pin = ++requestIdRef.current;
    setRouteLoading(true);
    setRouteError("");
    try {
      const res = await TripPlannerService.getRoute({
        hotelId: activeHotelId,
        destination: {
          placeId: destination.placeId,
          name: destination.name,
          latitude: destination.lat,
          longitude: destination.lng,
        },
        travelMode,
      });
      if (pin !== requestIdRef.current) return;
      setRoute(res.route);
    } catch (error) {
      if (pin !== requestIdRef.current) return;
      setRouteError(error.message);
      setRoute(null);
    } finally {
      if (pin === requestIdRef.current) setRouteLoading(false);
    }
  };

  const handleProfileChange = (value) => {
    setTravelProfile(value);
    try {
      localStorage.setItem("tripPlannerProfile", value);
    } catch {
      /* storage unavailable — non-fatal */
    }
  };

  // ── Render helpers ─────────────────────────────────────────────────────
  const renderPlaceCard = (place) => {
    const fav = isFavorite(favorites, place.placeId);
    return (
      <div
        key={place.placeId}
        className="group flex items-start gap-3 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-3 hover:border-[#183B35]/40 dark:hover:border-[#8FB8A8]/40 transition-all"
      >
        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#183B35]/10 dark:bg-[#8FB8A8]/10">
          {place.photoUrl ? (
            <img src={place.photoUrl} alt={place.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#183B35]/50 dark:text-[#8FB8A8]/50" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[#183B35] dark:text-[#F2EFE8] truncate">{place.name}</h4>
            <button
              type="button"
              onClick={() => handleToggleFavorite(place)}
              className={`flex-shrink-0 p-1 rounded-lg transition-colors ${fav ? "text-[#B8860B]" : "text-slate-300 dark:text-[#A9AEA7] hover:text-[#B8860B]"}`}
              title={fav ? "Remove from favorites" : "Save to favorites"}
            >
              <Heart className="w-4 h-4" fill={fav ? "currentColor" : "none"} />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-[#A9AEA7] line-clamp-1">{place.address}</p>
          <div className="flex items-center justify-between mt-1.5">
            {place.rating ? (
              <span className="flex items-center gap-1 text-xs text-[#B8860B]">
                <Star className="w-3 h-3" fill="currentColor" /> {place.rating}
                {place.userRatingsTotal ? <span className="text-slate-400 dark:text-[#A9AEA7]">({place.userRatingsTotal})</span> : null}
              </span>
            ) : (
              <span className="text-xs text-slate-300 dark:text-[#555]" />
            )}
            <div className="flex gap-1">
              {route?.destination?.placeId === place.placeId && destination ? (
                <button
                  type="button"
                  onClick={() => { setDestination(null); setRoute(null); setRouteError(""); }}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded-lg bg-[#183B35] text-white dark:bg-[#8FB8A8] dark:text-[#111412]"
                >
                  <X className="w-3 h-3" /> Clear route
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => pickPlace(place)}
                  className={`flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded-lg transition-colors ${
                    destination?.placeId === place.placeId
                      ? "bg-[#B8860B] text-white"
                      : "bg-[#183B35]/10 dark:bg-[#8FB8A8]/10 text-[#183B35] dark:text-[#8FB8A8] hover:bg-[#183B35] hover:text-white dark:hover:bg-[#8FB8A8] dark:hover:text-[#111412]"
                  }`}
                >
                  {destination?.placeId === place.placeId ? <Compass className="w-3 h-3" /> : <Navigation className="w-3 h-3" />}
                  {destination?.placeId === place.placeId ? "Planned" : "Route"}
                </button>
              )}
            </div>
            {place.photoUrl && (
              <button
                type="button"
                onClick={() => pickPlace(place)}
                className="absolute top-2 right-8 hidden group-hover:flex items-center gap-1 px-2 py-1 text-[10px] uppercase tracking-wider rounded-lg bg-black/60 text-white"
              >
                <Navigation className="w-3 h-3" /> Route
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  if (!userLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-2 border-[#183B35]/30 border-t-[#183B35] animate-spin" />
          <span className="text-sm text-slate-400 dark:text-[#A9AEA7] font-space">Loading...</span>
        </div>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412] px-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-[#183B35]/10 dark:bg-[#8FB8A8]/10 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-[#183B35] dark:text-[#8FB8A8]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#183B35] dark:text-[#F2EFE8] font-space">{translate("signInToContinue") || "Sign in to continue"}</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#A9AEA7]">Sign in to plan routes from your favorite hotels around the world.</p>
          <button onClick={() => navigate("/signup")} className="mt-6 px-8 py-3 gold-button text-xs uppercase tracking-[0.18em]">
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#183B35] dark:text-[#8FB8A8] animate-spin" />
          <span className="text-sm text-slate-400 dark:text-[#A9AEA7] font-space">Loading your hotels...</span>
        </div>
      </div>
    );
  }

  if (contextError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412] px-6">
        <div className="max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-[#183B35] dark:text-[#F2EFE8]">Trip Planner is unavailable</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#A9AEA7]">{contextError}</p>
          <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 gold-button text-xs uppercase tracking-[0.18em]">
            <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!activeHotel) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412] px-6">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-6 w-14 h-14 rounded-2xl bg-[#183B35]/10 dark:bg-[#8FB8A8]/10 flex items-center justify-center">
            <MapPin className="w-7 h-7 text-[#183B35] dark:text-[#8FB8A8]" />
          </div>
          <h1 className="text-2xl font-semibold text-[#183B35] dark:text-[#F2EFE8] font-space">Get started</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#A9AEA7]">No hotels are available yet. A super admin can add hotels from the admin dashboard.</p>
        </div>
      </div>
    );
  }

  const countries = [...new Set(hotels.map((h) => h.country).filter(Boolean))];

  return (
    <div className="min-h-screen bg-[#F7F5F0] dark:bg-[#111412] pt-20 pb-16 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#183B35] dark:text-[#F2EFE8] font-space flex items-center gap-3">
              <MapPin className="w-7 h-7" /> Trip Planner
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#A9AEA7]">
              Explore hotels across {countries.slice(0, 5).join(", ")}{countries.length > 5 ? " and more" : ""} and plan routes from your stay.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {visibleHotels.length > 1 && (
              <select
                value={countryFilter || ""}
                onChange={(e) => handleCountryFilter(e.target.value)}
                className="bg-white dark:bg-[#1A1E1B] border border-black/[0.08] dark:border-[#303631] rounded-lg px-3 py-2 text-xs uppercase tracking-[0.1em] text-slate-700 dark:text-[#F2EFE8] outline-none focus:border-[#183B35]/50"
              >
                <option value="">All countries</option>
                {countries.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-[#1A1E1B]">{c}</option>
                ))}
              </select>
            )}
            {visibleHotels.length > 1 ? (
              <select
                value={activeHotelId || ""}
                onChange={(e) => handleHotelSwitch(e.target.value)}
                className="bg-white dark:bg-[#1A1E1B] border border-black/[0.08] dark:border-[#303631] rounded-lg px-3 py-2 text-xs uppercase tracking-[0.1em] text-slate-700 dark:text-[#F2EFE8] outline-none focus:border-[#183B35]/50 max-w-[220px]"
              >
                {visibleHotels.map((h) => (
                  <option key={h._id} value={h._id} className="bg-white dark:bg-[#1A1E1B]">
                    {h.name} · {h.city}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 bg-white dark:bg-[#1A1E1B] border border-black/[0.08] dark:border-[#303631] rounded-lg px-3 py-2 text-xs text-slate-700 dark:text-[#F2EFE8]">
                <BuildingIcon />
                <span className="max-w-[220px] truncate">{activeHotel?.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Hotel info / location banner */}
        <div className="mb-6 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <span className="font-semibold text-[#183B35] dark:text-[#F2EFE8]">{activeHotel?.name}</span>
            <span className="flex items-center gap-1 text-slate-500 dark:text-[#A9AEA7]">
              <MapPin className="w-3.5 h-3.5" /> {activeHotel?.address}, {activeHotel?.city}
            </span>
            {activeLocation ? (
              <span className="text-xs text-[#183B35] dark:text-[#8FB8A8] bg-[#183B35]/10 dark:bg-[#8FB8A8]/10 px-2 py-0.5 rounded-lg">
                {activeLocation.latitude.toFixed(4)}, {activeLocation.longitude.toFixed(4)}
              </span>
            ) : (
              <span className="text-xs text-[#B45309] bg-[#B45309]/10 px-2 py-0.5 rounded-lg">
                Hotel location is incomplete. Please update the hotel location.
              </span>
            )}
            <span className="text-xs text-slate-400 dark:text-[#A9AEA7]">Timezone: {activeHotel?.timezone || "not set"}</span>
          </div>
        </div>

        {/* Tabs + panels */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
          {/* Left: control panels */}
          <div className="space-y-4">
            <div className="flex rounded-xl bg-white dark:bg-[#1A1E1B] border border-black/[0.06] dark:border-[#303631] p-1 text-xs uppercase tracking-[0.08em]">
              {[
                { key: "discover", label: "Discover" },
                { key: "route", label: "Plan a route" },
                { key: "favorites", label: `Favorites (${favorites.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => { setActiveTab(tab.key); if (tab.key === "route" && !destination && places.length) setDestination({ placeId: places[0].placeId, name: places[0].name, lat: places[0].lat, lng: places[0].lng }); }}
                  className={`flex-1 px-2 py-2 rounded-lg transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#183B35] text-white dark:bg-[#8FB8A8] dark:text-[#111412]"
                      : "text-slate-500 dark:text-[#A9AEA7] hover:text-[#183B35] dark:hover:text-[#8FB8A8]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Discover */}
            {activeTab === "discover" && (
              <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search place by name…"
                      className="w-full bg-[#F7F5F0] dark:bg-[#111412] border border-black/[0.08] dark:border-[#303631] rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 dark:text-[#F2EFE8] outline-none focus:border-[#183B35]/50"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#183B35] text-white dark:bg-[#8FB8A8] dark:text-[#111412] text-xs uppercase tracking-wider disabled:opacity-50"
                  >
                    {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Go"}
                  </button>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-[#A9AEA7]">Travel profile</label>
                  <input
                    value={travelProfile}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    placeholder="e.g. solo, honeymoon, adventure"
                    className="mt-1 w-full bg-[#F7F5F0] dark:bg-[#111412] border border-black/[0.08] dark:border-[#303631] rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-[#F2EFE8] outline-none focus:border-[#183B35]/50"
                  />
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {CATEGORIES.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => { setCategory(key); loadNearby(key); }}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-colors ${
                        category === key
                          ? "bg-[#183B35] text-white dark:bg-[#8FB8A8] dark:text-[#111412]"
                          : "bg-[#183B35]/5 dark:bg-[#8FB8A8]/10 text-[#183B35] dark:text-[#8FB8A8] hover:bg-[#183B35]/10"
                      }`}
                    >
                      <Icon className="w-3 h-3" /> {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {SEARCH_RADII.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => { setRadius(r.value); loadNearby(category, r.value); }}
                      className={`px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider transition-colors ${
                        radius === r.value
                          ? "bg-[#B8860B] text-white"
                          : "bg-white dark:bg-[#111412] border border-black/[0.08] dark:border-[#303631] text-slate-500 dark:text-[#A9AEA7]"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {POPULAR_SEARCHES.map((q) => (
                    <button
                      key={q}
                      onClick={() => { setSearchQuery(q); setSearching(true); TripPlannerService.search({ hotelId: activeHotelId, query: travelProfile.trim() ? `${travelProfile.trim()} ${q}` : q }).then((res) => { setPlaces(res.places || []); setPlacesError(""); setPlacesMessage(res.places?.length ? "" : "No matches found."); }).catch((e) => { setPlacesError(e.message); setPlaces([]); }).finally(() => setSearching(false)); }}
                      className="px-2 py-1 rounded-lg text-[10px] uppercase tracking-wider bg-[#B8860B]/10 dark:bg-[#B8860B]/20 text-[#B8860B] hover:bg-[#B8860B]/20"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                {/* Results list */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-[#A9AEA7]">
                      {placesLoading ? "Loading…" : places.length ? `${places.length} places` : "Results"}
                    </span>
                    <button
                      onClick={() => activeLocation ? loadNearby() : loadNearby()}
                      className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#183B35] dark:text-[#8FB8A8]"
                      title="Refresh nearby"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh
                    </button>
                  </div>
                  {placesError && (
                    <div className="rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#B91C1C] dark:text-[#F87171] text-xs p-3 text-center">
                      {placesError}
                    </div>
                  )}
                  {placesMessage && !placesError && (
                    <div className="rounded-lg bg-[#183B35]/5 dark:bg-[#8FB8A8]/10 text-[#183B35] dark:text-[#8FB8A8] text-xs p-3 text-center">
                      {placesMessage}
                    </div>
                  )}
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {places.map(renderPlaceCard)}
                  </div>
                </div>
              </div>
            )}

            {/* Route planner */}
            {activeTab === "route" && (
              <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Navigation className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" />
                  <span className="text-slate-600 dark:text-[#A9AEA7]">From </span>
                  <span className="font-semibold text-[#183B35] dark:text-[#F2EFE8] truncate">{activeHotel?.name}</span>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-[#A9AEA7]">Destination</label>
                  {destination ? (
                    <div className="mt-1 flex items-center justify-between gap-2 rounded-lg bg-[#183B35]/5 dark:bg-[#8FB8A8]/10 p-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[#183B35] dark:text-[#F2EFE8] truncate">{destination.name}</p>
                        {route?.distanceText && route.durationText ? (
                          <p className="text-xs text-slate-500 dark:text-[#A9AEA7]">
                            {route.distanceText} · {route.durationText}
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-[#A9AEA7]">Tap Get route to calculate</p>
                        )}
                      </div>
                      <button onClick={() => { setDestination(null); setRoute(null); setRouteError(""); }} className="flex-shrink-0 p-1 text-slate-400 hover:text-[#B91C1C]">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-400 dark:text-[#A9AEA7]">Pick a destination from Discover, or search below.</p>
                  )}
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-[#A9AEA7]">Travel mode</label>
                  <div className="mt-1 grid grid-cols-4 gap-1.5">
                    {TRAVEL_MODES.map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setTravelMode(key)}
                        className={`flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] uppercase tracking-wider transition-colors ${
                          travelMode === key
                            ? "bg-[#183B35] text-white dark:bg-[#8FB8A8] dark:text-[#111412]"
                            : "bg-[#183B35]/5 dark:bg-[#8FB8A8]/10 text-[#183B35] dark:text-[#8FB8A8] hover:bg-[#183B35]/10"
                        }`}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {routeError && (
                  <div className="rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-[#B91C1C] dark:text-[#F87171] text-xs p-3 text-center">
                    {routeError}
                  </div>
                )}

                <button
                  onClick={buildRoute}
                  disabled={!destination || routeLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#183B35] text-white dark:bg-[#8FB8A8] dark:text-[#111412] text-xs uppercase tracking-[0.18em] disabled:opacity-40"
                >
                  {routeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                  {routeLoading ? "Planning…" : "Get route"}
                </button>

                {route && (
                  <div className="rounded-xl bg-[#183B35]/5 dark:bg-[#8FB8A8]/10 p-3 space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#A9AEA7]">Distance</span>
                      <span className="font-semibold text-[#183B35] dark:text-[#F2EFE8]">{route.distanceText}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-[#A9AEA7]">Duration</span>
                      <span className="font-semibold text-[#183B35] dark:text-[#F2EFE8]">{route.durationText}</span>
                    </div>
                    {route.summary && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 dark:text-[#A9AEA7]">Via</span>
                        <span className="font-medium text-[#183B35] dark:text-[#F2EFE8] text-right">{route.summary}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Favorites */}
            {activeTab === "favorites" && (
              <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] p-4 space-y-3">
                <span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-[#A9AEA7]">Saved places (in progress)</span>
                {favorites.length === 0 ? (
                  <p className="text-sm text-slate-400 dark:text-[#A9AEA7]">Tap the heart on any place to save it here.</p>
                ) : (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {favorites.map((fav) => (
                      <div key={fav.placeId} className="flex items-start gap-3 rounded-xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#111412] p-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-[#183B35] dark:text-[#F2EFE8] truncate">{fav.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-[#A9AEA7] line-clamp-1">{fav.address}</p>
                          {fav.rating ? (
                            <span className="flex items-center gap-1 mt-1 text-xs text-[#B8860B]">
                              <Star className="w-3 h-3" fill="currentColor" /> {fav.rating}
                            </span>
                          ) : null}
                        </div>
                        <button
                          onClick={() => handleToggleFavorite(fav)}
                          className="flex-shrink-0 p-1 text-[#B91C1C]"
                          title="Remove"
                        >
                          <Heart className="w-4 h-4" fill="currentColor" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: map */}
          <div className="rounded-2xl overflow-hidden border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] h-[480px] lg:h-[720px] relative">
            {!mapsLoaded && !mapsError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412]">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#183B35] dark:text-[#8FB8A8] animate-spin" />
                  <span className="text-xs text-slate-400 font-space">Loading map…</span>
                </div>
              </div>
            )}
            {mapsError && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412] px-6">
                <div className="text-center max-w-sm">
                  <p className="text-sm font-semibold text-[#183B35] dark:text-[#F2EFE8]">
                    {mapsError === "maps-key-missing" ? "Map key missing." : "Map temporarily unavailable."}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-[#A9AEA7]">
                    {mapsError === "maps-key-missing"
                      ? "Add VITE_GOOGLE_MAPS_API_KEY to frontend/.env.local to enable the map."
                      : "Check your Google Maps key and billing, then retry."}
                  </p>
                  <button onClick={() => loadMaps(true)} className="mt-4 px-5 py-2 gold-button text-xs uppercase tracking-[0.18em]">
                    <RefreshCw className="w-3.5 h-3.5 inline mr-1" /> Retry
                  </button>
                </div>
              </div>
            )}
            {!activeLocation && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#F7F5F0] dark:bg-[#111412] px-6">
                <p className="text-sm text-slate-500 dark:text-[#A9AEA7] text-center">
                  No map available — the hotel location is incomplete. Update the hotel address with coordinates.
                </p>
              </div>
            )}
            <div ref={mapElRef} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

const BuildingIcon = () => (
  <svg className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 21h18M6 21V7l6-4v18M18 21V11l-6 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default TripPlanner;