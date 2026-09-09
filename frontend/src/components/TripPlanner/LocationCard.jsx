// LocationCard — Polished location popup: map card on desktop, bottom sheet on mobile.
// Shows name, address, category, distance from previous point, travel time,
// and Add to Trip / View Stop / Remove Stop actions.
import { createPortal } from "react-dom";
import { useEffect } from "react";
import { Clock, MapPin, Navigation, X } from "lucide-react";
import { formatDistance, formatDuration } from "../../utils/tripGeo";

const LocationCard = ({ place, onClose, onAdd, onRemove, busy = false, added = false }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!place) return null;

  const coords =
    Number.isFinite(place.lat) && Number.isFinite(place.lng)
      ? `${place.lat.toFixed(5)}, ${place.lng.toFixed(5)}`
      : null;

  const body = (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={place.name ? `Location: ${place.name}` : "Selected location"}
      className="fixed inset-x-3 bottom-3 z-[1300] rounded-2xl border border-[#E3E0D8] bg-white p-4 shadow-[var(--shadow-lg)] md:absolute md:inset-auto md:bottom-auto md:left-1/2 md:top-4 md:w-80 md:-translate-x-1/2 dark:border-[#303631] dark:bg-[#1A1E1B]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">
            <MapPin className="h-4 w-4 shrink-0 text-[#A67C52]" />
            <span className="truncate">{place.name || "Selected Location"}</span>
          </p>
          {place.address && (
            <p className="mt-0.5 truncate text-xs text-[#5C6B64] dark:text-[#A9AEA7]">{place.address}</p>
          )}
          {place.category && (
            <span className="mt-1.5 inline-block rounded-full bg-[#EFEEE8] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5C6B64] dark:bg-[#222823] dark:text-[#A9AEA7]">
              {place.category}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close location details"
          className="rounded-lg p-1.5 text-[#72766F] transition-colors hover:bg-[#EFEEE8] dark:text-[#A9AEA7] dark:hover:bg-[#222823]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-[#E3E0D8] pt-3 text-xs dark:border-[#303631]">
        {Number.isFinite(place.distanceKm) && (
          <div>
            <dt className="flex items-center gap-1 text-[#72766F] dark:text-[#A9AEA7]">
              <Navigation className="h-3 w-3" /> Distance
            </dt>
            <dd className="mt-0.5 font-semibold text-[#202522] dark:text-[#F2EFE8]">
              {formatDistance(place.distanceKm)}
            </dd>
          </div>
        )}
        {Number.isFinite(place.durationMin) && (
          <div>
            <dt className="flex items-center gap-1 text-[#72766F] dark:text-[#A9AEA7]">
              <Clock className="h-3 w-3" /> Travel time
            </dt>
            <dd className="mt-0.5 font-semibold text-[#202522] dark:text-[#F2EFE8]">
              {formatDuration(place.durationMin)}
            </dd>
          </div>
        )}
      </dl>

      {coords && !place.name && (
        <p className="mt-2 text-[11px] text-[#72766F] dark:text-[#A9AEA7]">
          Coordinates: {coords}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        {place.isHotel ? (
          <button
            type="button"
            onClick={onClose}
            className="ghost-button flex-1 px-3 py-2 text-xs"
          >
            Starting Point
          </button>
        ) : added ? (
          <>
            <button
              type="button"
              onClick={onAdd}
              disabled={busy}
              className="flex-1 rounded-[10px] border border-[#E3E0D8] bg-white px-3 py-2 text-xs font-semibold text-[#183B35] transition-colors hover:border-[#A67C52] dark:border-[#303631] dark:bg-[#1A1E1B] dark:text-[#F2EFE8]"
            >
              View Stop
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={busy}
              className="flex-1 rounded-[10px] bg-[#B14646] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#DD7070]"
            >
              Remove Stop
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            disabled={busy || (!place.name && !coords)}
            className="gold-button flex-1 px-3 py-2 text-xs"
          >
            {busy ? "Resolving…" : "Add to Trip"}
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(body, document.body);
};

export default LocationCard;
