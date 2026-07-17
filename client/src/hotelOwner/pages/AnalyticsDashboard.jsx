import { useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Globe, Users } from "lucide-react";

const COLORS = ["#D4A85F", "#F5D08A", "#8B5CF6", "#EC4899", "#10B981", "#3B82F6", "#EF4444", "#F97316", "#06B6D4", "#6366F1"];

const AnalyticsDashboard = () => {
  const { axios } = useAppContext();
  const [range, setRange] = useState("30d");
  const [trends, setTrends] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [t, d, r, dm] = await Promise.all([
        axios.get(`/api/analytics/booking-trends?range=${range}`),
        axios.get("/api/analytics/popular-destinations?limit=10"),
        axios.get(`/api/analytics/revenue?range=${range}`),
        axios.get(`/api/analytics/demographics?range=${range}`),
      ]);
      setTrends(t.data.data);
      setDestinations(d.data.data || []);
      setRevenue(r.data.data);
      setDemographics(dm.data.data);
    } catch {
      toast.error("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [range]);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tourist Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Trend analysis and tourist insights</p>
        </div>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-sm">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last 1 year</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-12 text-white/40">Loading analytics...</div>
      ) : (
        <div className="space-y-6">
          {revenue && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-white/50 text-xs mb-1">Revenue</div>
                <div className="text-2xl font-bold text-white">{revenue.summary?.totalRevenue?.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-white/50 text-xs mb-1">Paid Bookings</div>
                <div className="text-2xl font-bold text-white">{revenue.summary?.paidBookings}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-white/50 text-xs mb-1">Avg Order Value</div>
                <div className="text-2xl font-bold text-white">{revenue.summary?.avgOrderValue?.toLocaleString()}</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-white/50 text-xs mb-1">Bookings</div>
                <div className="text-2xl font-bold text-white">{trends?.totalBookings || 0}</div>
              </div>
            </div>
          )}

          {trends && trends.trend && trends.trend.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Booking Trends</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="period" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "#0B1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Line type="monotone" dataKey="bookings" stroke="#D4A85F" strokeWidth={2} dot={{ fill: "#D4A85F" }} />
                    <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: "#8B5CF6" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {destinations.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Globe className="w-4 h-4" /> Popular Destinations</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={destinations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="city" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: "#0B1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                    <Bar dataKey="bookings" fill="#D4A85F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {demographics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> Guest Group Size</h3>
                {demographics.groupSize && demographics.groupSize.length > 0 ? (
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={demographics.groupSize} dataKey="count" nameKey="size" cx="50%" cy="50%" outerRadius={70} label>
                          {demographics.groupSize.map((entry, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: "#0B1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : <p className="text-white/40 text-sm">No data</p>}
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <h3 className="text-white font-semibold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Payment Methods</h3>
                {revenue?.paymentMethods && Object.keys(revenue.paymentMethods).length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={Object.entries(revenue.paymentMethods).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} />
                      <Tooltip contentStyle={{ backgroundColor: "#0B1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px" }} />
                      <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-white/40 text-sm">No data</p>}
              </div>
            </div>
          )}

          {revenue?.topHotels && revenue.topHotels.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">Top Performing Hotels</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-white/40 border-b border-white/10">
                      <th className="pb-3 font-medium">Hotel</th>
                      <th className="pb-3 font-medium">Bookings</th>
                      <th className="pb-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {revenue.topHotels.map((h) => (
                      <tr key={h.name}>
                        <td className="py-3 text-white">{h.name}</td>
                        <td className="py-3 text-white/70">{h.bookings}</td>
                        <td className="py-3 text-[#F5D08A]">{h.revenue?.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
