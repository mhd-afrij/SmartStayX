// tripGeo.js — Pure trip-planning helpers: polyline decoding, distance/duration
// formatting, stop numbering, and the arrival/departure ETA chain.

// Decodes a Google encoded polyline (overview_polyline.points) into [lat, lng] pairs.
// Algorithm reference: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
export const decodePolyline = (encoded) => {
  if (!encoded || typeof encoded !== "string") return [];
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let b;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 0;
    shift = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
};

// Haversine distance in km between two { lat, lng } points.
export const haversineKm = (a, b) => {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

// Formats minutes as "1h 35m" / "45m" / "3h".
export const formatDuration = (minutes) => {
  const mins = Math.max(0, Math.round(Number(minutes) || 0));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Formats a km value as "181 km" (or metres below 1 km).
export const formatDistance = (km) => {
  const value = Math.max(0, Number(km) || 0);
  if (value > 0 && value < 1) return `${Math.round(value * 1000)} m`;
  return `${Math.round(value)} km`;
};

// Formats a 24h minutes-since-midnight as "6:40 PM".
export const formatTimeOfDay = (minutes) => {
  const total = ((Math.round(Number(minutes) || 0) % 1440) + 1440) % 1440;
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
};

// Parses a "HH:MM" 24h string into minutes-since-midnight. Returns 540 (9:00 AM) when invalid.
export const parseDepartureTime = (value) => {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value || "").trim());
  if (!match) return 540;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return 540;
  return h * 60 + m;
};

// Categorical colors for stop types (decorative only — numbering carries the info).
export const categoryColor = (category = "") => {
  const key = String(category).toLowerCase();
  if (key.includes("restaurant") || key.includes("food")) return "#A67C52";
  if (key.includes("beach")) return "#3E7C82";
  if (key.includes("park") || key.includes("museum") || key.includes("attraction")) return "#4C6F5B";
  if (key.includes("airport") || key.includes("transport")) return "#8A643F";
  return "#183B35";
};

/**
 * Computes the full ETA chain for a route.
 * @param {Array<{lat:number,lng:number,name:string}>} points  [hotel, ...stops]
 * @param {Array<{distance:{value:number},duration:{value:number}}>} legs  Google legs (seconds/metres)
 * @param {Array<number>} stopDurations  per-stop dwell minutes (aligned with stops, not points)
 * @param {number} departureMin  departure time in minutes-since-midnight
 * @returns {{ segments: Array, arrivalTimes: number[], departureTimes: number[], totals }}
 */
export const buildEtaChain = (points, legs, stopDurations = [], departureMin = 540) => {
  const segments = [];
  const arrivalTimes = [];
  const departureTimes = [];

  let clock = parseDepartureTime(departureMin);
  departureTimes.push(clock);

  points.forEach((point, i) => {
    if (i === 0) return;
    const leg = legs ? legs[i - 1] : null;
    const durationMin = leg ? (leg.duration?.value || 0) / 60 : 0;
    const distanceKm = leg ? (leg.distance?.value || 0) / 1000 : haversineKm(points[i - 1], point);
    clock += durationMin;
    arrivalTimes.push(clock);

    const stayMin = i <= stopDurations.length ? Number(stopDurations[i - 1]) || 0 : 0;
    clock += stayMin;
    departureTimes.push(clock);

    segments.push({
      from: points[i - 1],
      to: point,
      distanceKm,
      durationMin,
      arrivalTime: clock,
    });
  });

  return {
    segments,
    arrivalTimes,
    departureTimes,
    totals: {
      distanceKm: segments.reduce((sum, s) => sum + s.distanceKm, 0),
      durationMin: segments.reduce((sum, s) => sum + s.durationMin, 0),
      stops: points.length - 1,
    },
  };
};

// Stop label: 01, 02, ... for stops, the hotel, or the finish flag.
export const stopNumber = (index) => String(index + 1).padStart(2, "0");
