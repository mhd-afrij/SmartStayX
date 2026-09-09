// SavedTrips — Saved trips drawer: load, rename, delete previously planned trips.
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FolderOpen, Loader2, Route as RouteIcon, Trash2, X } from "lucide-react";
import { formatDistance, formatDuration } from "../../utils/tripGeo";

const SavedTrips = ({ open, trips = [], loading = false, onClose, onLoad, onDelete }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Saved trips"
      className="fixed inset-0 z-[1400] flex justify-end bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="h-full w-full max-w-sm overflow-y-auto border-l border-[#E3E0D8] bg-[#F7F5F0] p-4 shadow-[var(--shadow-lg)] dark:border-[#303631] dark:bg-[#111412]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#202522] dark:text-[#F2EFE8]">Saved Trips</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close saved trips"
            className="rounded-lg p-1.5 text-[#72766F] transition-colors hover:bg-[#EFEEE8] dark:text-[#A9AEA7] dark:hover:bg-[#222823]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {loading && (
            <p className="flex items-center gap-2 py-6 text-sm text-[#5C6B64] dark:text-[#A9AEA7]">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading trips…
            </p>
          )}

          {!loading && trips.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#E3E0D8] px-4 py-8 text-center dark:border-[#303631]">
              <RouteIcon className="mx-auto h-6 w-6 text-[#A67C52]" />
              <p className="mt-2 text-sm text-[#5C6B64] dark:text-[#A9AEA7]">
                No saved trips yet. Plan a route and save it.
              </p>
            </div>
          )}

          {trips.map((trip) => (
            <div
              key={trip._id}
              className="rounded-xl border border-[#E3E0D8] bg-white p-3 dark:border-[#303631] dark:bg-[#1A1E1B]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">
                    {trip.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#72766F] dark:text-[#A9AEA7]">
                    {(trip.stops || []).length} stop{(trip.stops || []).length === 1 ? "" : "s"}
                    {trip.totalDistanceKm ? ` · ${formatDistance(trip.totalDistanceKm)}` : ""}
                    {trip.totalDurationMin ? ` · ${formatDuration(trip.totalDurationMin)}` : ""}
                    {` · ${trip.status || "draft"}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onLoad(trip)}
                    aria-label={`Load trip ${trip.name}`}
                    className="rounded-lg p-1.5 text-[#8A643F] transition-colors hover:bg-[#F6EFE3] dark:text-[#C5A47E] dark:hover:bg-[#33302A]"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(trip)}
                    aria-label={`Delete trip ${trip.name}`}
                    className="rounded-lg p-1.5 text-[#72766F] transition-colors hover:bg-red-50 hover:text-[#DC2626] dark:text-[#A9AEA7] dark:hover:bg-[#B14646]/20 dark:hover:text-[#DD7070]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {(trip.stops || []).length > 0 && (
                <p className="mt-2 truncate border-t border-[#E3E0D8] pt-2 text-[11px] text-[#5C6B64] dark:border-[#303631] dark:text-[#A9AEA7]">
                  {(trip.stops || []).map((s) => s.name).join(" → ")}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SavedTrips;
