// RoutePanel — Trip route editor: hotel start card, drag-and-drop reorderable
// stops with per-segment distance/ETA, add destination, and the trip summary.
import { useState } from "react";
import { GripVertical, Hotel as HotelIcon, MapPin, Plus, Trash2 } from "lucide-react";
import { formatDistance, formatDuration, formatTimeOfDay, stopNumber } from "../../utils/tripGeo";

const RoutePanel = ({
  hotel,
  stops = [],
  eta = null,
  departureTime = "09:00",
  onDepartureChange,
  onStopDurationChange,
  onRemoveStop,
  onReorder,
  onFocusStop,
  routeError = "",
  calculating = false,
  onSave,
  saving = false,
  saveDisabled = false,
}) => {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  const handleDragStart = (index) => (e) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
    try {
      e.dataTransfer.setData("text/plain", String(index));
    } catch {
      /* some engines require setData; ignore failures */
    }
  };

  const handleDragOver = (index) => (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverIndex(index);
  };

  const handleDrop = (index) => (e) => {
    e.preventDefault();
    const from = dragIndex ?? Number(e.dataTransfer.getData("text/plain"));
    setOverIndex(null);
    setDragIndex(null);
    if (from == null || Number.isNaN(from) || from === index) return;
    onReorder(from, index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const totals = eta?.totals;
  const hasStops = stops.length > 0;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* ── Starting point ──────────────────────────────────────────────── */}
      <section aria-label="Starting point" className="luxury-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#72766F] dark:text-[#A9AEA7]">
          Starting Point
        </p>
        <div className="mt-2 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#183B35] text-base dark:bg-[#8FB8A8]">
            🏨
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">
              {hotel?.name || "Your Hotel"}
            </p>
            {hotel?.address && (
              <p className="truncate text-xs text-[#5C6B64] dark:text-[#A9AEA7]">{hotel.address}</p>
            )}
            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-[#F6EFE3] px-2 py-0.5 text-[10px] font-semibold text-[#8A643F] dark:bg-[#33302A] dark:text-[#D9BC96]">
              <HotelIcon className="h-3 w-3" /> Hotel location is automatically selected
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 border-t border-[#E3E0D8] pt-3 dark:border-[#303631]">
          <label htmlFor="departure-time" className="text-xs text-[#5C6B64] dark:text-[#A9AEA7]">
            Departure
          </label>
          <input
            id="departure-time"
            type="time"
            value={departureTime}
            onChange={(e) => onDepartureChange?.(e.target.value)}
            className="luxury-input h-9 flex-1 px-2.5 py-1 text-xs"
          />
        </div>
      </section>

      {/* ── Stops ───────────────────────────────────────────────────────── */}
      <section aria-label="Trip stops" className="luxury-card flex min-h-0 flex-1 flex-col p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#72766F] dark:text-[#A9AEA7]">
            Stops {hasStops ? `(${stops.length})` : ""}
          </p>
          {calculating && (
            <span className="text-[11px] text-[#A67C52] dark:text-[#C5A47E]">Calculating route…</span>
          )}
        </div>

        {!hasStops && (
          <p className="mt-3 rounded-xl border border-dashed border-[#E3E0D8] px-3 py-6 text-center text-xs text-[#72766F] dark:border-[#303631] dark:text-[#A9AEA7]">
            No destinations added.
            <br />
            Search for a place or select a location on the map.
          </p>
        )}

        <ol className="mt-2 min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Ordered stops">
          {stops.map((stop, index) => {
            const segment = eta?.segments?.[index]; // segment INTO this stop
            const isLast = index === stops.length - 1;
            const isDragging = dragIndex === index;
            const isOver = overIndex === index && dragIndex !== null && dragIndex !== index;
            return (
              <li
                key={stop.key || `${stop.placeId}-${index}`}
                draggable
                onDragStart={handleDragStart(index)}
                onDragOver={handleDragOver(index)}
                onDrop={handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`rounded-xl border transition-colors ${
                  isOver
                    ? "border-[#A67C52] bg-[#F6EFE3] dark:border-[#C5A47E] dark:bg-[#33302A]"
                    : isDragging
                      ? "border-transparent opacity-50"
                      : "border-transparent"
                }`}
              >
                {segment && (
                  <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] text-[#72766F] dark:text-[#A9AEA7]">
                    <span aria-hidden="true" className="ml-4 border-l border-dashed border-[#A67C52]/50" />
                    {formatDistance(segment.distanceKm)} · {formatDuration(segment.durationMin)}
                  </div>
                )}
                <div className="flex items-center gap-2 px-1.5 py-1.5">
                  <span
                    className="flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-full text-[11px] font-bold text-white active:cursor-grabbing dark:text-[#111412]"
                    style={{ backgroundColor: isLast ? "#A67C52" : stop.markerColor || "#183B35" }}
                    aria-hidden="true"
                  >
                    {isLast ? "🏁" : stopNumber(index)}
                  </span>
                  <GripVertical
                    className="h-4 w-4 shrink-0 cursor-grab text-[#72766F]/60 dark:text-[#A9AEA7]/60"
                    aria-hidden="true"
                  />
                  <button
                    type="button"
                    onClick={() => onFocusStop?.(stop)}
                    className="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A67C52] rounded"
                    aria-label={`Stop ${index + 1}: ${stop.name}. Activate to highlight on map.`}
                  >
                    <span className="block truncate text-sm font-medium text-[#202522] dark:text-[#F2EFE8]">
                      {stop.name}
                    </span>
                    {Number(stop.stopDuration) > 0 && (
                      <span className="block text-[11px] text-[#5C6B64] dark:text-[#A9AEA7]">
                        Stay {formatDuration(stop.stopDuration)}
                        {eta?.departureTimes?.[index + 1] != null &&
                          ` · depart ${formatTimeOfDay(eta.departureTimes[index + 1])}`}
                      </span>
                    )}
                    {eta?.arrivalTimes?.[index] != null && (
                      <span className="block text-[11px] text-[#72766F] dark:text-[#A9AEA7]">
                        ETA {formatTimeOfDay(eta.arrivalTimes[index])}
                      </span>
                    )}
                  </button>
                  <label className="sr-only" htmlFor={`stop-duration-${index}`}>
                    Stop duration for {stop.name}
                  </label>
                  <select
                    id={`stop-duration-${index}`}
                    value={String(Number(stop.stopDuration) || 0)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "custom") {
                        const input = window.prompt("Custom stop duration in minutes", "45");
                        if (input == null) return;
                        onStopDurationChange?.(index, Math.max(0, Math.min(Number(input) || 0, 720)));
                        return;
                      }
                      onStopDurationChange?.(index, Number(v));
                    }}
                    className="cursor-pointer rounded-lg border border-[#E3E0D8] bg-white px-1.5 py-1 text-[11px] font-medium text-[#8A643F] outline-none transition-colors hover:border-[#A67C52]/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#A67C52] dark:border-[#303631] dark:bg-[#1A1E1B] dark:text-[#C5A47E]"
                  >
                    <option value="0">No stay</option>
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    {![0, 15, 30, 60, 120].includes(Number(stop.stopDuration) || 0) && (
                      <option value={String(Number(stop.stopDuration))}>{formatDuration(Number(stop.stopDuration))}</option>
                    )}
                    <option value="custom">Custom…</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => onRemoveStop?.(index)}
                    className="rounded-lg p-1.5 text-[#72766F] transition-colors hover:bg-red-50 hover:text-[#DC2626] dark:text-[#A9AEA7] dark:hover:bg-[#B14646]/20 dark:hover:text-[#DD7070]"
                    aria-label={`Remove ${stop.name} from trip`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        {routeError && (
          <p role="alert" className="mt-2 rounded-lg bg-[#B14646]/10 px-3 py-2 text-xs text-[#B14646] dark:text-[#DD7070]">
            {routeError}
          </p>
        )}

        <button
          type="button"
          onClick={() =>
            document.querySelector('input[role="combobox"]')?.focus()
          }
          className="mt-3 flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-[#A67C52]/50 px-3 py-2.5 text-xs font-semibold text-[#8A643F] transition-colors hover:bg-[#F6EFE3] dark:border-[#C5A47E]/50 dark:text-[#C5A47E] dark:hover:bg-[#33302A]"
        >
          <Plus className="h-4 w-4" /> Add Destination
        </button>
      </section>

      {/* ── Trip summary ────────────────────────────────────────────────── */}
      <section aria-label="Trip summary" className="luxury-card p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#72766F] dark:text-[#A9AEA7]">
          Trip Summary
        </p>
        {hasStops && totals ? (
          <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2.5">
            <div>
              <dt className="text-[11px] text-[#72766F] dark:text-[#A9AEA7]">Total Distance</dt>
              <dd className="text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">
                {formatDistance(totals.distanceKm)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#72766F] dark:text-[#A9AEA7]">Driving Time</dt>
              <dd className="text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">
                {formatDuration(totals.durationMin)}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#72766F] dark:text-[#A9AEA7]">Stops</dt>
              <dd className="text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">{totals.stops}</dd>
            </div>
            <div>
              <dt className="text-[11px] text-[#72766F] dark:text-[#A9AEA7]">Estimated Arrival</dt>
              <dd className="text-sm font-semibold text-[#202522] dark:text-[#F2EFE8]">
                {eta?.departureTimes?.length
                  ? formatTimeOfDay(eta.departureTimes[eta.departureTimes.length - 1])
                  : "—"}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-2 text-xs text-[#72766F] dark:text-[#A9AEA7]">
            Add a destination to see distance, driving time, and arrival estimate.
          </p>
        )}
        <button
          type="button"
          onClick={onSave}
          disabled={saveDisabled || saving || !hasStops}
          className="gold-button mt-3 w-full px-4 py-2.5 text-sm"
        >
          {saving ? "Saving…" : "Save Trip"}
        </button>
      </section>
    </div>
  );
};

export default RoutePanel;
