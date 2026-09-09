// revenueForecastService.js — AI revenue & occupancy forecasting with ML upsert
// Forecasts revenue, occupancy demand, and seasonal demand for 7/30/90 day
// windows. Backed by historical booking data (statistical model) with an
// optional ML-service prediction when available. Never throws on ML failure.
import axios from "axios";
import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import { BOOKING_STATUS } from "../constants/bookingStatuses.js";
import logger from "../utils/logger.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5000";
const ML_INTERNAL_TOKEN = process.env.ML_INTERNAL_TOKEN || "";

const EXCLUDED_STATUSES = [BOOKING_STATUS.CANCELLED, BOOKING_STATUS.EXPIRED];
const ACTIVE_STATUSES = [BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN, BOOKING_STATUS.RESERVATION];

const dayFromMs = 24 * 60 * 60 * 1000;

// Rolling window of recent completed/active bookings used to compute baseline
// rates and seasonality. Larger window = smoother but less responsive.
const HISTORY_WINDOW_DAYS = 120;

const buildQuery = (hotelId, start, end) => {
  const query = {
    checkInDate: { $gte: start, $lte: end },
    status: { $nin: EXCLUDED_STATUSES },
    createdAt: { $gte: new Date(Date.now() - HISTORY_WINDOW_DAYS * dayFromMs) },
  };
  if (hotelId) query.hotel = hotelId;
  return query;
};

const computeSeasonalFactors = (bookings) => {
  const monthDist = {};
  bookings.forEach((b) => {
    const m = new Date(b.checkInDate).getMonth();
    monthDist[m] = (monthDist[m] || 0) + 1;
  });
  const total = bookings.length || 1;
  const avg = total / 12;
  const factors = {};
  for (let m = 0; m < 12; m++) {
    const count = monthDist[m] || 0;
    factors[m] = avg > 0 ? +(count / avg).toFixed(2) : 1;
  }
  return factors;
};

const periodLabel = (ms) => {
  const label = ms > 2 * dayFromMs ? "weekend" : ms >= dayFromMs ? "1-3 days" : "today";
  return label;
};

export class RevenueForecastService {
  // Forecast revenue + occupancy + seasonal demand for the next N days.
  async forecast({ hotelId, range = 30, includeML = true } = {}) {
    const days = Math.min(365, Math.max(1, Number(range) || 30));
    const now = new Date();
    const start = new Date(now.getTime() + dayFromMs);
    const end = new Date(now.getTime() + days * dayFromMs);

    const [{ history, totals, roomCount }] = await Promise.all([
      this._computeBaseline(hotelId),
    ]);

    const daily = [];
    const that = this;
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() + (i + 1) * dayFromMs);
      const month = date.getMonth();
      const dow = date.getDay();
      const seasonalFactor = history.seasonalFactors[month] || 1;
      const weekendFactor = dow === 5 || dow === 6 ? (history.avgWeekendRate > 0 ? history.avgWeekendRate / Math.max(0.01, history.avgDailyRate) : 1.15) : 1;

      // Baseline demand is derived from realized bookings per day, projected
      // forward. Doubles as the occupancy driver.
      const projectedBookings = Math.max(0, Math.round(history.avgDailyBookings * seasonalFactor * weekendFactor));
      const projectedRevenue = Math.round(projectedBookings * history.avgBookingValue * seasonalFactor);

      daily.push({
        date: date.toISOString().split("T")[0],
        projectedBookings,
        projectedRevenue,
        expectedOccupancyPercent: roomCount > 0
          ? Math.min(100, +(((projectedBookings * (totals.avgStayNights || 1)) / roomCount) * 100).toFixed(1))
          : 0,
        demandLevel: projectedBookings >= (history.highDemandThreshold || 5) ? "high" : projectedBookings > 0 ? "moderate" : "low",
        seasonalFactor: _round(seasonalFactor),
      });
    }

    const totalRevenue = daily.reduce((s, d) => s + d.projectedRevenue, 0);
    const avgOccupancy = daily.length ? +(daily.reduce((s, d) => s + d.expectedOccupancyPercent, 0) / daily.length).toFixed(1) : 0;
    const seasonalDemand = {};
    for (let i = 0; i < daily.length; i += Math.max(1, Math.floor(days / 6))) {
      const d = daily[i];
      if (!d) continue;
      seasonalDemand[d.date] = d.demandLevel;
    }

    let ml = null;
    if (includeML && process.env.ENABLE_ML_FORECAST !== "false") {
      ml = await that._mlForecast({ hotelId, days, roomCount, history });
    }

    return {
      range: days,
      hotelId: hotelId || null,
      generatedAt: now.toISOString(),
      summary: {
        totalRevenue,
        avgDailyRevenue: daily.length ? Math.round(totalRevenue / daily.length) : 0,
        avgOccupancyPercent: avgOccupancy,
        projectedBookings: daily.reduce((s, d) => s + d.projectedBookings, 0),
        confidence: history.bookingSamples > 30 ? "high" : history.bookingSamples > 10 ? "medium" : "low",
      },
      daily,
      seasonalDemand,
      seasonality: history.seasonalFactors,
      ml,
    };
  }

  // Human-readable pricing suggestions, e.g. "Increase Deluxe Room price by 12%…"
  async suggestions({ hotelId, range = "30d" } = {}) {
    const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
    const forecast = await this.forecast({ hotelId, range: days, includeML: false });
    const rooms = hotelId ? await Room.find({ hotel: hotelId }).lean() : [];
    const activeBookings = await Booking.countDocuments({
      ...(hotelId ? { hotel: hotelId } : {}),
      status: { $in: ACTIVE_STATUSES },
      checkOutDate: { $gte: new Date() },
    });

    const capacity = rooms.reduce((s, r) => s + (r.inventoryCount || 1), 0);
    const projectedOccupancy = forecast.summary.avgOccupancyPercent || 0;
    const roomNights = rooms.length || 1;

    const suggestionsSet = [];
    if (projectedOccupancy >= 85) {
      suggestionsSet.push({
        id: "high_occupancy_raise",
        type: "pricing",
        title: "Demand is expected to be high",
        message: `Increase ${roomNights <= 1 ? "room" : "rooms"} prices by up to 12% because occupancy is expected to reach ${projectedOccupancy}%.`,
        suggestedAction: "Raise nightly rates on premium room types by 8–12% during the forecast window.",
        impacted: projectedOccupancy >= 90 ? "high" : "medium",
      });
    } else if (projectedOccupancy < 45) {
      suggestionsSet.push({
        id: "low_occupancy_promote",
        type: "promotion",
        title: "Occupancy is expected to dip",
        message: `Projected occupancy is ${projectedOccupancy}%. Consider a targeted offer or last-minute discount to lift demand.`,
        suggestedAction: "Create a promotional offer or apply a last-minute discount for the next 7 days.",
        impacted: "medium",
      });
    } else {
      suggestionsSet.push({
        id: "stable_demand_hold",
        type: "monitor",
        title: "Demand is stable",
        message: `Projected occupancy is ${projectedOccupancy}% across the next ${days} days. Hold current rates and monitor booking velocity.`,
        suggestedAction: "Maintain current pricing. Re-run forecast weekly.",
        impacted: "low",
      });
    }

    // Per-room-type suggestions using the legacy enhanced insights.
    const enhanced = await this._enhancedForHotel({ hotelId, range: `${days}d`, activeBookings, capacity });
    if (enhanced?.length) suggestionsSet.push(...enhanced);

    // Weekend / seasonality guidance
    const peakMonths = Object.entries(forecast.seasonality || {})
      .filter(([, f]) => f >= 1.15)
      .map(([m]) => new Date(2020, Number(m), 1).toLocaleString("en", { month: "short" }));
    if (peakMonths.length) {
      suggestionsSet.push({
        id: "seasonal_window",
        type: "event",
        title: "Peak seasonality ahead",
        message: `Seasonal demand is projected to be strongest in ${peakMonths.join(", ")}. Raise prices in advance for those windows.`,
        suggestedAction: `Apply a seasonal price multiplier during ${peakMonths.join(", ")}.`,
        impacted: "high",
      });
    }

    return {
      suggestions: suggestionsSet.slice(0, 15),
      forecast,
    };
  }

  async _computeBaseline(hotelId) {
    const start = new Date(Date.now() - HISTORY_WINDOW_DAYS * dayFromMs);
    const bookings = await Booking.find(buildQuery(hotelId, start, new Date()))
      .select("totalPrice checkInDate checkOutDate status")
      .lean();
    const roomCount = hotelId ? await Room.countDocuments({ hotel: hotelId }) : await Room.estimatedDocumentCount();

    const completed = bookings.filter((b) => [BOOKING_STATUS.CHECKED_OUT, BOOKING_STATUS.CONFIRMED, BOOKING_STATUS.CHECKED_IN].includes(b.status));
    const revenue = completed.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0);
    const distinctDays = new Set(bookings.map((b) => new Date(b.checkInDate).toDateString())).size || 1;
    const stayNights = bookings.reduce((s, b) => {
      const nights = Math.ceil((new Date(b.checkOutDate) - new Date(b.checkInDate)) / dayFromMs);
      return s + Math.max(1, nights);
    }, 0);

    // Weekend premium vs weekday
    const weekendBookings = bookings.filter((b) => [5, 6].includes(new Date(b.checkInDate).getDay()));
    const weekdayBookings = bookings.filter((b) => ![5, 6].includes(new Date(b.checkInDate).getDay()));
    const avgDailyRate = completed.length ? revenue / Math.max(1, distinctDays) : 0;
    const avgWeekendRate = weekendBookings.length
      ? weekendBookings.reduce((s, b) => s + (Number(b.totalPrice) || 0), 0) / weekendBookings.length
      : 0;

    return {
      history: {
        avgDailyBookings: bookings.length ? +(bookings.length / distinctDays).toFixed(2) : 0,
        avgDailyRate: Math.round(avgDailyRate),
        avgWeekendRate: Math.round(avgWeekendRate),
        avgBookingValue: bookings.length ? Math.round(revenue / bookings.length) : 0,
        highDemandThreshold: Math.max(1, Math.round((bookings.length / Math.max(1, distinctDays)) * 1.5)),
        bookingSamples: bookings.length,
        seasonalFactors: computeSeasonalFactors(bookings),
      },
      totals: { avgStayNights: stayNights / Math.max(1, bookings.length) },
      roomCount,
    };
  }

  async _mlForecast({ hotelId, days, roomCount, history }) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/forecast`, {
        hotelId,
        days,
        roomCount,
        history: {
          avgDailyBookings: history.avgDailyBookings,
          avgBookingValue: history.avgBookingValue,
          seasonalFactors: history.seasonalFactors,
        },
      }, {
        timeout: 3000,
        ...(ML_INTERNAL_TOKEN ? { headers: { "x-internal-token": ML_INTERNAL_TOKEN } } : {}),
      });
      return {
        source: "ml",
        totalRevenue: response.data?.totalRevenue ?? null,
        avgOccupancyPercent: response.data?.avgOccupancyPercent ?? null,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.warn("ML forecast unavailable: %s", error.message);
      return null;
    }
  }

  async _enhancedForHotel({ hotelId, range, activeBookings, capacity }) {
    try {
      const pricingMLService = (await import("./pricingMLService.js")).default;
      const data = await pricingMLService.getEnhancedSuggestions({ hotelId, range: `${range}d` });
      if (!data?.suggestions?.length) return [];
      return data.suggestions.slice(0, 5).map((s) => ({
        id: `room_${s.roomId}`,
        type: "pricing",
        title: `${s.roomType || "Room"} pricing opportunity`,
        message: s.changePercent >= 0
          ? `Increase ${s.roomType} price by ${s.changePercent}% based on demand, occupancy (${s.occupancyFactor || "—"}×) and seasonality.`
          : `Consider holding ${s.roomType} pricing — demand currently supports a ${Math.abs(s.changePercent)}% adjustment window.`,
        suggestedAction: `Suggested ${s.roomType} rate: ${s.suggestedPrice}${data.currency ? ` ${data.currency}` : ""}.`,
        impacted: s.confidence === "high" ? "high" : "medium",
      }));
    } catch (error) {
      logger.warn("Enhanced suggestions skipped: %s", error.message);
      return [];
    }
  }
}

const _round = (n) => +(Number(n) || 0).toFixed(2);

export default new RevenueForecastService();