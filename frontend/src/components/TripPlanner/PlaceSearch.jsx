// PlaceSearch — Debounced destination search with keyboard-accessible results.
import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Plus, Search } from "lucide-react";

const PlaceSearch = ({ axios, hotel, onAdd, addLabel = "Add to Trip", disabled = false }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const listboxId = useId();

  useEffect(() => {
    const handler = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) return undefined;
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError("");
      try {
        const tripPlannerService = (await import("../../services/TripPlannerService")).default;
        const data = await tripPlannerService.searchPlaces(
          axios,
          trimmed,
          hotel?.lat ?? null,
          hotel?.lng ?? null
        );
        if (cancelled) return;
        setResults((data.places || []).slice(0, 8));
        setOpen(true);
      } catch (err) {
        if (!cancelled && !err.cancelled) {
          setError(err.message || "Unable to find this location.");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Debounce: 450ms after the last keystroke.
    const timer = setTimeout(run, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, axios, hotel]);

  const pick = (place) => {
    setOpen(false);
    setQuery("");
    setResults([]);
    onAdd(place);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor={listboxId} className="sr-only">Search destinations</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#72766F] dark:text-[#A9AEA7]" />
        <input
          id={listboxId}
          type="text"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search destinations…"
          disabled={disabled}
          className="w-full rounded-[10px] border border-[#E3E0D8] bg-white py-2.5 pl-9 pr-9 text-sm text-[#202522] placeholder:text-[#72766F] outline-none transition-colors focus:border-[#A67C52] focus:ring-3 focus:ring-[#A67C52]/20 dark:border-[#303631] dark:bg-[#1A1E1B] dark:text-[#F2EFE8] dark:placeholder:text-[#A9AEA7] disabled:opacity-60"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-[#A67C52]" />
        )}
      </div>

      {error && <p className="mt-1.5 text-xs text-[#DC2626]">{error}</p>}

      {open && results.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search results"
          className="absolute z-[1200] mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-[#E3E0D8] bg-white shadow-[var(--shadow-lg)] dark:border-[#303631] dark:bg-[#1A1E1B]"
        >
          {results.map((place, i) => (
            <li key={place.placeId || `${place.name}-${i}`} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => pick(place)}
                className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-[#EFEEE8] focus-visible:bg-[#EFEEE8] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#A67C52] dark:hover:bg-[#222823] dark:focus-visible:bg-[#222823]"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#A67C52]" />
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
                <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full border border-[#A67C52]/30 bg-[#F6EFE3] px-2 py-0.5 text-[10px] font-semibold text-[#8A643F] dark:border-[#C5A47E]/30 dark:bg-[#33302A] dark:text-[#D9BC96]">
                  <Plus className="h-3 w-3" /> Add
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!loading && open && query.trim().length >= 3 && results.length === 0 && !error && (
        <div className="absolute z-[1200] mt-1.5 w-full rounded-xl border border-[#E3E0D8] bg-white px-3 py-3 text-xs text-[#5C6B64] shadow-[var(--shadow-md)] dark:border-[#303631] dark:bg-[#1A1E1B] dark:text-[#A9AEA7]">
          No places found. Try a different name.
        </div>
      )}

      <p className="mt-1.5 text-[11px] text-[#72766F] dark:text-[#A9AEA7]">{addLabel}</p>
    </div>
  );
};

export default PlaceSearch;
