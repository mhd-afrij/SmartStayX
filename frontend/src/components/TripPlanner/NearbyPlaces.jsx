// NearbyPlaces — Hotel-centered discovery by category.
import { useEffect, useState } from "react";
import { Loader2, MapPin, Plus } from "lucide-react";

const NEARBY_CATEGORIES = [
  { key: "attractions", label: "Attractions" },
  { key: "restaurants", label: "Restaurants" },
  { key: "shopping", label: "Shopping" },
  { key: "beaches", label: "Beaches" },
  { key: "parks", label: "Parks" },
  { key: "museums", label: "Museums" },
  { key: "airports", label: "Airports" },
  { key: "hospitals", label: "Hospitals" },
  { key: "entertainment", label: "Entertainment" },
  { key: "transport", label: "Transport" },
];

const NearbyPlaces = ({ axios, hotel, onAdd, disabled = false }) => {
  const [category, setCategory] = useState("attractions");
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hotel?.lat || !hotel?.lng || disabled) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");
      setPlaces([]);
      try {
        const tripPlannerService = (await import("../../services/TripPlannerService")).default;
        const data = await tripPlannerService.getNearbyPlaces(axios, {
          lat: hotel.lat,
          lng: hotel.lng,
          category,
        });
        if (cancelled) return;
        setPlaces((data.places || []).slice(0, 12));
      } catch (err) {
        if (!cancelled) setError(err.message || "Unable to find nearby places.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [axios, hotel?.lat, hotel?.lng, category, disabled]);

  return (
    <section aria-label="Explore nearby places">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#72766F] dark:text-[#A9AEA7]">
        Explore nearby places
      </h3>

      <div
        role="tablist"
        aria-label="Place categories"
        className="mt-2.5 flex flex-wrap gap-1.5"
      >
        {NEARBY_CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            type="button"
            role="tab"
            aria-selected={category === cat.key}
            onClick={() => setCategory(cat.key)}
            disabled={disabled}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A67C52] disabled:opacity-50 ${
              category === cat.key
                ? "border-[#183B35] bg-[#183B35] text-white dark:border-[#8FB8A8] dark:bg-[#8FB8A8] dark:text-[#111412]"
                : "border-[#E3E0D8] bg-white text-[#5C6B64] hover:border-[#A67C52]/50 dark:border-[#303631] dark:bg-[#1A1E1B] dark:text-[#A9AEA7] dark:hover:border-[#C5A47E]/50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="mt-3">
        {loading && (
          <p className="flex items-center gap-2 py-3 text-xs text-[#5C6B64] dark:text-[#A9AEA7]">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Finding nearby places…
          </p>
        )}
        {!loading && error && <p className="py-2 text-xs text-[#DC2626]">{error}</p>}
        {!loading && !error && places.length === 0 && (
          <p className="py-2 text-xs text-[#72766F] dark:text-[#A9AEA7]">
            No places found in this category nearby.
          </p>
        )}
        <ul className="divide-y divide-[#E3E0D8] dark:divide-[#303631]">
          {places.map((place, i) => (
            <li key={place.placeId || `${place.name}-${i}`}>
              <button
                type="button"
                onClick={() => onAdd(place)}
                disabled={disabled}
                className="group flex w-full items-center gap-2.5 py-2.5 text-left transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#A67C52] disabled:opacity-50"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EFEEE8] dark:bg-[#222823]">
                  <MapPin className="h-4 w-4 text-[#8A643F] dark:text-[#C5A47E]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-[#202522] dark:text-[#F2EFE8]">
                    {place.name}
                  </span>
                  {place.address && (
                    <span className="block truncate text-xs text-[#5C6B64] dark:text-[#A9AEA7]">
                      {place.address}
                    </span>
                  )}
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#A67C52]/30 bg-[#F6EFE3] px-2 py-0.5 text-[10px] font-semibold text-[#8A643F] opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 dark:border-[#C5A47E]/30 dark:bg-[#33302A] dark:text-[#D9BC96]">
                  <Plus className="h-3 w-3" /> Add
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default NearbyPlaces;
