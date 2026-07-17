import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { TrendingUp, Target, BarChart3, RefreshCw, Brain, Cpu } from "lucide-react";
import API_ENDPOINTS from "../../config/endpoints";

const DynamicPricing = () => {
  const { axios, getToken } = useAppContext();
  const [hotelId, setHotelId] = useState("");
  const [roomType, setRoomType] = useState("");
  const [range, setRange] = useState("30d");
  const [result, setResult] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savingPrice, setSavingPrice] = useState("");

  const fetchHotels = async () => {
    try {
      const ownerRes = await axios.get("/api/hotels/owner");
      let allHotels = ownerRes.data.data || ownerRes.data.hotels || [];
      if (allHotels.length === 0) {
        const publicRes = await axios.get("/api/hotels/all");
        allHotels = publicRes.data.hotels || [];
      }
      setHotels(allHotels);
      if (allHotels.length > 0) setHotelId(allHotels[0]._id);
    } catch {}
  };

  useEffect(() => { fetchHotels(); }, []);

  const runAnalysis = async () => {
    if (!hotelId) return;
    setLoading(true);
    try {
      const qs = new URLSearchParams({ hotelId, range });
      if (roomType) qs.set("roomType", roomType);
      const [pricingRes, occRes] = await Promise.all([
        axios.get(`${API_ENDPOINTS.pricingML.enhanced}?${qs.toString()}`),
        axios.get(`${API_ENDPOINTS.pricing.occupancy}?${qs.toString()}`),
      ]);
      setResult(pricingRes.data.data);
      setOccupancy(occRes.data.data);
    } catch {
      toast.error("Failed to analyse pricing");
    } finally {
      setLoading(false);
    }
  };

  const applyPrice = async (room) => {
    setSavingPrice(room.roomId);
    try {
      const token = getToken();
      await axios.post(
        "/api/pricing/update",
        { roomId: room.roomId, suggestedPrice: room.suggestedPrice },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      toast.success("Price updated");
    } catch {
      toast.error("Failed to update price");
    } finally {
      setSavingPrice("");
    }
  };

  const applyMLPrice = async (room) => {
    if (!room.mlPredictedPrice) return;
    setSavingPrice(room.roomId);
    try {
      const token = getToken();
      await axios.post(
        "/api/pricing/update",
        { roomId: room.roomId, suggestedPrice: room.mlPredictedPrice },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      toast.success("ML price applied");
    } catch {
      toast.error("Failed to update price");
    } finally {
      setSavingPrice("");
    }
  };

  const confidenceBadge = (c) => {
    const colors = { high: "bg-green-500/20 text-green-300", medium: "bg-yellow-500/20 text-yellow-300", low: "bg-red-500/20 text-red-300" };
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors[c] || colors.low}`}>{c}</span>;
  };

  const mlConfidenceBadge = (score) => {
    if (score == null) return <span className="text-white/30 text-[10px]">—</span>;
    const level = score >= 0.7 ? "high" : score >= 0.4 ? "medium" : "low";
    return confidenceBadge(level);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Dynamic Pricing</h1>
          <p className="text-white/50 text-sm mt-1">ML-driven pricing predictions based on demand, seasonality, occupancy, and competitor data</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-white/60 mb-1">Hotel</label>
            <select value={hotelId} onChange={(e) => setHotelId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="">Select hotel</option>
              {hotels.map((h) => <option key={h._id} value={h._id}>{h.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Room Type</label>
            <input value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm" placeholder="Optional" />
          </div>
          <div>
            <label className="block text-xs text-white/60 mb-1">Range</label>
            <select value={range} onChange={(e) => setRange(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm">
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last 1 year</option>
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={runAnalysis} disabled={loading || !hotelId} className="w-full px-4 py-2 bg-[#D4A85F] text-[#0B1220] rounded-xl font-medium hover:bg-[#F5D08A] disabled:opacity-50 text-sm flex items-center justify-center gap-2">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />} {loading ? "Analysing..." : "Analyse"}
            </button>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/50 text-xs mb-1">Total Bookings</div>
              <div className="text-2xl font-bold text-white">{result.totalBookings}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/50 text-xs mb-1">Revenue</div>
              <div className="text-2xl font-bold text-white">{result.totalRevenue?.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/50 text-xs mb-1">Avg Rate</div>
              <div className="text-2xl font-bold text-white">{result.averageRate?.toLocaleString()}</div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-white/50 text-xs mb-1">Generated</div>
              <div className="text-sm font-medium text-white/80">{new Date(result.generatedAt).toLocaleString()}</div>
            </div>
          </div>

          {result.marketInsights && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Market Insights</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-white/50">Peak Days</span>
                  <p className="text-white font-medium">{result.marketInsights.peakDays?.join(", ") || "None"}</p>
                </div>
                <div>
                  <span className="text-white/50">Peak Season</span>
                  <p className={`font-medium ${result.marketInsights.isPeakSeason ? "text-yellow-400" : "text-green-400"}`}>
                    {result.marketInsights.isPeakSeason ? "Active" : "Off"}
                  </p>
                </div>
                <div>
                  <span className="text-white/50">Holiday Season</span>
                  <p className={`font-medium ${result.marketInsights.isHolidaySeason ? "text-yellow-400" : "text-green-400"}`}>
                    {result.marketInsights.isHolidaySeason ? "Active" : "Off"}
                  </p>
                </div>
                <div>
                  <span className="text-white/50">Occupancy Rate</span>
                  <p className="text-white font-medium">{(result.marketInsights.occupancyRate * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Target className="w-4 h-4" /> Price Suggestions
              {result.mlServiceAvailable && (
                <span className="ml-2 flex items-center gap-1 text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                  <Cpu className="w-3 h-3" /> ML Active
                </span>
              )}
            </h3>
            {result.suggestions.length === 0 ? (
              <p className="text-white/40 text-sm">No historical data available for suggestions.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="pb-3 font-medium">Room</th>
                      <th className="pb-3 font-medium">Current</th>
                      <th className="pb-3 font-medium">ML Price</th>
                      <th className="pb-3 font-medium">Rule Price</th>
                      <th className="pb-3 font-medium">ML Change</th>
                      <th className="pb-3 font-medium">Rule Change</th>
                      <th className="pb-3 font-medium">ML Conf.</th>
                      <th className="pb-3 font-medium">Demand</th>
                      <th className="pb-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {result.suggestions.map((s, i) => (
                      <tr key={i}>
                        <td className="py-3 text-white whitespace-nowrap">{s.roomType || s.roomId}</td>
                        <td className="py-3 text-white/70">{s.currentPrice?.toLocaleString()}</td>
                        <td className="py-3 text-[#F5D08A] font-medium">
                          {s.mlPredictedPrice ? s.mlPredictedPrice.toLocaleString() : <span className="text-white/30">—</span>}
                        </td>
                        <td className="py-3 text-white/70">{s.suggestedPrice?.toLocaleString()}</td>
                        <td className={`py-3 ${s.mlChangePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {s.mlChangePercent != null ? `${s.mlChangePercent > 0 ? "+" : ""}${s.mlChangePercent}%` : <span className="text-white/30">—</span>}
                        </td>
                        <td className={`py-3 ${s.changePercent >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {s.changePercent > 0 ? "+" : ""}{s.changePercent}%
                        </td>
                        <td className="py-3">{mlConfidenceBadge(s.mlConfidence)}</td>
                        <td className="py-3 text-white/70">{s.demandFactor}x</td>
                        <td className="py-3 flex gap-1">
                          {s.mlPredictedPrice && (
                            <button onClick={() => applyMLPrice(s)} disabled={savingPrice === s.roomId} className="px-2 py-1 bg-[#D4A85F]/20 text-[#F5D08A] rounded-lg text-[10px] hover:bg-[#D4A85F]/30 disabled:opacity-50 whitespace-nowrap">
                              {savingPrice === s.roomId ? "..." : "ML Apply"}
                            </button>
                          )}
                          <button onClick={() => applyPrice(s)} disabled={savingPrice === s.roomId} className="px-2 py-1 bg-white/10 rounded-lg text-white text-[10px] hover:bg-white/20 disabled:opacity-50 whitespace-nowrap">
                            {savingPrice === s.roomId ? "..." : "Rule Apply"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Brain className="w-4 h-4" /> Pricing Factors Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-white/40 border-b border-white/10">
                    <th className="pb-3 font-medium">Room</th>
                    <th className="pb-3 font-medium">Season</th>
                    <th className="pb-3 font-medium">Amenity</th>
                    <th className="pb-3 font-medium">Occupancy</th>
                    <th className="pb-3 font-medium">Weekend</th>
                    <th className="pb-3 font-medium">Season Peak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {result.suggestions.map((s, i) => (
                    <tr key={i}>
                      <td className="py-3 text-white">{s.roomType || s.roomId}</td>
                      <td className="py-3 text-white/70">{s.seasonMultiplier}x</td>
                      <td className="py-3 text-white/70">{s.amenityFactor}x</td>
                      <td className="py-3 text-white/70">{s.occupancyFactor}x</td>
                      <td className="py-3 text-white/70">{(s.weekendSurcharge * 100).toFixed(0)}%</td>
                      <td className="py-3">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.factors?.isPeakSeason ? "bg-yellow-500/20 text-yellow-300" : "bg-green-500/20 text-green-300"}`}>
                          {s.factors?.isPeakSeason ? "Peak" : "Off-Peak"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {occupancy && (
        <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Occupancy Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-white/50 text-xs">Total Bookings</div>
              <div className="text-xl font-bold text-white">{occupancy.overall?.totalBookings || 0}</div>
            </div>
            <div>
              <div className="text-white/50 text-xs">Total Revenue</div>
              <div className="text-xl font-bold text-white">{occupancy.overall?.totalRevenue?.toLocaleString() || 0}</div>
            </div>
            <div>
              <div className="text-white/50 text-xs">Rooms with Bookings</div>
              <div className="text-xl font-bold text-white">{occupancy.overall?.roomsWithBookings || 0}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPricing;
