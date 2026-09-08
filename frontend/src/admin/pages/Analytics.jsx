import { useEffect, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Globe, Users, BarChart3, CalendarCheck } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card, StatCard } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { SkeletonCard, ErrorState, EmptyState } from '../../components/ui/States';

const COLORS = ['#D4A853', '#4D6166', '#7C9885', '#E08D79', '#8B93A8', '#C79A5B', '#6B8F71', '#A8735A', '#7B8AAE', '#B5926A'];

const RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last 1 year' },
];

const GRANULARITIES = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

const Analytics = () => {
  const { axios, formatPrice, theme } = useAppContext();
  const [range, setRange] = useState('30d');
  const [granularity, setGranularity] = useState('day');
  const [trends, setTrends] = useState(null);
  const [destinations, setDestinations] = useState([]);
  const [revenue, setRevenue] = useState(null);
  const [demographics, setDemographics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError(false);
    try {
      const [t, d, r, dm] = await Promise.all([
        axios.get(`/api/analytics/booking-trends?range=${range}&granularity=${granularity}`),
        axios.get('/api/analytics/popular-destinations?limit=10'),
        axios.get(`/api/analytics/revenue?range=${range}`),
        axios.get(`/api/analytics/demographics?range=${range}`),
      ]);
      setTrends(t.data.data);
      setDestinations(d.data.data || []);
      setRevenue(r.data.data);
      setDemographics(dm.data.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, granularity]);

  const dark = theme === 'dark';
  const gridColor = dark ? '#1D3842' : '#E8E0D1';
  const axisColor = dark ? '#9FB2B8' : '#4D6166';
  const tooltipStyle = {
    backgroundColor: dark ? '#122A32' : '#ffffff',
    border: `1px solid ${dark ? '#1D3842' : 'rgba(0,56,68,0.09)'}`,
    borderRadius: '8px',
    color: dark ? '#E9F1F2' : '#14181f',
    fontSize: '12px',
  };

  const chartCard = (title, Icon, children, actions) => (
    <Card className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-[#003844] dark:text-[#E9F1F2] font-semibold flex items-center gap-2">
          <Icon className="w-4 h-4 text-[#B58A2E] dark:text-[#E6C075]" /> {title}
        </h3>
        {actions}
      </div>
      {children}
    </Card>
  );

  return (
    <div>
      <PageHeader
        title="Platform Analytics"
        description="Platform-wide trends, revenue, and guest insights across every hotel."
        actions={
          <Select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="!h-9 !text-xs w-44"
          >
            {RANGES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        }
      />

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => <SkeletonCard key={i} />)}
          </div>
          <Card className="p-5 space-y-3">
            <div className="h-4 w-40 rounded bg-[#E8E0D1] dark:bg-[#1D3842] animate-pulse" />
            <div className="h-64 rounded-xl bg-[#E8E0D1] dark:bg-[#1D3842] animate-pulse" />
          </Card>
        </div>
      ) : error ? (
        <ErrorState description="Could not load analytics." onRetry={fetchAll} />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Revenue" value={formatPrice(revenue?.summary?.totalRevenue)} icon={TrendingUp} tone="gold" />
            <StatCard label="Paid Bookings" value={revenue?.summary?.paidBookings ?? 0} icon={CalendarCheck} tone="success" />
            <StatCard label="Avg Order Value" value={formatPrice(revenue?.summary?.avgOrderValue)} icon={BarChart3} tone="primary" />
            <StatCard label="Total Bookings" value={trends?.totalBookings ?? 0} icon={Users} tone="primary" />
          </div>

          {trends?.trend?.length > 0 ? (
            chartCard('Booking Trends', TrendingUp, (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="period" stroke={axisColor} fontSize={12} tickMargin={8} />
                    <YAxis stroke={axisColor} fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => (name === 'revenue' ? formatPrice(value) : value)} />
                    <Line type="monotone" dataKey="bookings" stroke="#D4A853" strokeWidth={2} dot={{ fill: '#D4A853', r: 3 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#4D6166" strokeWidth={2} dot={{ fill: '#4D6166', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ), (
              <div className="flex items-center gap-1 p-1 rounded-lg border border-[#E8E0D1] dark:border-[#232737] bg-[#FFFAF4] dark:bg-[#10131D]">
                {GRANULARITIES.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setGranularity(g.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      granularity === g.value
                        ? 'bg-[#D4A853] dark:bg-[#E6C075] text-[#2A230F] shadow-sm'
                        : 'text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            ))
          ) : null}

          {destinations.length > 0 ? (
            chartCard('Popular Destinations', Globe, (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={destinations}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="city" stroke={axisColor} fontSize={12} tickMargin={8} />
                    <YAxis stroke={axisColor} fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => (name === 'revenue' ? formatPrice(value) : value)} />
                    <Bar dataKey="bookings" fill="#D4A853" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))
          ) : null}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {demographics?.groupSize?.length > 0
              ? chartCard('Guest Group Size', Users, (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={demographics.groupSize}
                        dataKey="count"
                        nameKey="size"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label={({ name }) => `${name} guests`}
                      >
                        {demographics.groupSize.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ))
              : null}

            {revenue?.paymentMethods && Object.keys(revenue.paymentMethods).length > 0
              ? chartCard('Payment Methods', BarChart3, (
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={Object.entries(revenue.paymentMethods).map(([name, value]) => ({ name, value }))}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                      <XAxis dataKey="name" stroke={axisColor} fontSize={12} tickMargin={8} />
                      <YAxis stroke={axisColor} fontSize={12} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="value" fill="#4D6166" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ))
              : null}
          </div>

          {revenue?.topHotels?.length > 0 ? (
            chartCard('Top Performing Hotels', TrendingUp, (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#4D6166] dark:text-[#9FB2B8] uppercase text-xs border-b border-[#E8E0D1] dark:border-[#232737]">
                      <th className="pb-3 font-medium text-left">Hotel</th>
                      <th className="pb-3 font-medium text-left">Bookings</th>
                      <th className="pb-3 font-medium text-left">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D1] dark:divide-[#1D3842]">
                    {revenue.topHotels.map((h) => (
                      <tr key={h.name} className="hover:bg-[#F3ECDE] dark:hover:bg-[#16303A] transition-colors">
                        <td className="py-3 text-[#003844] dark:text-[#E9F1F2]">{h.name}</td>
                        <td className="py-3 text-[#4D6166] dark:text-[#9FB2B8]">{h.bookings}</td>
                        <td className="py-3 text-[#B58A2E] dark:text-[#E6C075] font-medium">{formatPrice(h.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : null}

          {!trends?.trend?.length && destinations.length === 0 && (!demographics?.groupSize?.length) && !revenue?.topHotels?.length && (
            <Card>
              <EmptyState
                icon={BarChart3}
                title="No analytics data"
                description="There are no bookings in the selected period yet. Try a wider date range."
              />
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Analytics;
