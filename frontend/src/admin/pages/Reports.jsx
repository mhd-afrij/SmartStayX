import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Card, StatCard } from '../../components/ui/Card';
import { Table } from '../../components/ui/States';
import { SkeletonCard, EmptyState, ErrorState } from '../../components/ui/States';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LineChart, BarChart, PieChart, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Line } from 'recharts';
import { TrendingUp, BarChart3, Users, CalendarCheck, DollarSign, Loader2 as L2 } from 'lucide-react';

const Reports = () => {
  const { axios, getToken, formatPrice, theme } = useAppContext();
  const navigate = useNavigate();
  const [range, setRange] = useState('30d');
  const [granularity, setGranularity] = useState('day');
  const [revenueReport, setRevenueReport] = useState(null);
  const [hotelPerformance, setHotelPerformance] = useState(null);
  const [paymentsReport, setPaymentsReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const dark = theme === 'dark';
  const gridColor = dark ? '#303631' : '#E3E0D8';
  const axisColor = dark ? '#A9AEA7' : '#5C6B64';
  const tooltipStyle = {
    backgroundColor: dark ? '#1A1E1B' : '#ffffff',
    border: `1px solid ${dark ? '#303631' : 'rgba(24,59,53,0.09)'}`,
    borderRadius: '8px',
    color: dark ? '#F2EFE8' : '#202522',
    fontSize: '12px',
  };

  const fetchAll = async () => {
    try {
      const [rev, hotel, pay] = await Promise.all([
      axios.get(`/api/admin/reports/revenue?range=${range}&granularity=${granularity}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      }),
      axios.get('/api/admin/reports/hotels', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      }),
      axios.get('/api/admin/payments?paid=true', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      }),
    ]);
    setRevenueReport(rev.data.data);
    setHotelPerformance(hotel.data.data);
    setPaymentsReport(pay.data.data);
    } catch {
      // keep state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [range, granularity]);

  const rev = revenueReport || {};
  const hp = hotelPerformance || [];
  const pay = paymentsReport || { payments: [], refunds: { count: 0, totalAmount: 0 }, total: 0, page: 1 };

  const revenueStats = rev?.summary || {};
  const totalRevenue = revenueStats?.totalRevenue || 0;
  const commissionRate = rev?.commissionRate || 10;
  const platformCommission = revenueStats?.platformCommission || 0;
  const bookingCount = rev?.bookingCount || 0;

  const performanceRows = hp.map((h) => ({
    hotel: h.hotel?.name || '—',
    bookings: h.bookings || 0,
    revenue: h.revenue || 0,
    completed: h.completed || 0,
    conversion: h.conversion !== undefined ? h.conversion : 0,
  }));

  const payments = pay?.payments || [];
  const totalRefunded = pay?.refunds?.totalAmount || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Platform Reports</h1>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Comprehensive analytics across bookings, hotels, and payments.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <StatCard label="Total Revenue" value={formatPrice(totalRevenue)} icon={DollarSign} tone="gold" />
        </div>
        <div>
          <StatCard label="Booking Count" value={bookingCount} icon={Users} tone="primary" />
        </div>
        <div>
          <StatCard label="Platform Commission" value={`${commissionRate}%`} icon={TrendingUp} tone="primary" />
        </div>
        <div>
          <StatCard label="Total Refunded" value={formatPrice(totalRefunded)} icon={Loader2} tone="danger" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Revenue Report</h2>
          {loading ? (
            <div className="p-4">Loading..</div>
          ) : revenueReport ? (
            <Card padded={false} className="overflow-hidden">
              <div className="flex items-center justify-between">
                <select
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] focus:border-[#A67C52]/60 transition-colors"
                >
                  <option value="7d">7 days</option>
                  <option value="30d">30 days</option>
                  <option value="90d">90 days</option>
                  <option value="1y">1 year</option>
                </select>
                <select
                  value={granularity}
                  onChange={(e) => setGranularity(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] focus:border-[#A67C52]/60 transition-colors"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </div>
              <div className="mt-4">
                <ResponsiveContainer width="100%" height="300">
                  <LineChart data={rev?.trend?.length > 0 ? rev.trend : []} dataKey="period">
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="period" stroke={axisColor} fontSize={12} />
                    <YAxis stroke={axisColor} fontSize={12} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="revenue" stroke="#183B35" strokeWidth={2} dot={{ fill: '#183B35', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4">
                <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Total Revenue: {formatPrice(totalRevenue)}</p>
                <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Platform Commission: {platformCommission}</p>
                <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Booking Count: {bookingCount}</p>
              </div>
            </Card>
          ) : (
            <EmptyState icon={Loader2} title="No revenue data" description="Revenue report appears here after selection." />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Hotel Performance</h2>
          {loading ? (
            <div className="p-4">Loading..</div>
          ) : hp.length > 0 ? (
            <Card padded={false} className="overflow-hidden">
              <Table data={performanceRows} columns={[
                { key: 'hotel', label: 'Hotel' },
                { key: 'bookings', label: 'Bookings' },
                { key: 'revenue', label: 'Revenue' },
                { key: 'completed', label: 'Completed' },
                { key: 'conversion', label: 'Conversion %' },
              ]} />
            </Card>
          ) : (
            <EmptyState icon={Loader2} title="No hotel performance data" description="Appears after selecting a revenue range." />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Payments Report</h2>
          {loading ? (
            <div className="p-4">Loading..</div>
          ) : payments.length > 0 ? (
            <Card padded={false} className="overflow-hidden">
              <Table data={payments} columns={[
                { key: '_id', label: 'Booking ID' },
                { key: 'guestDisplayName', label: 'Guest' },
                { key: 'amount', label: 'Amount' },
                { key: 'isPaid', label: 'Paid' },
                { key: 'status', label: 'Status' },
                { key: 'hotel', label: 'Hotel' },
              ]} />
              <div className="mt-4">
                <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Total Refunded: {formatPrice(totalRefunded)}</p>
              </div>
            </Card>
          ) : (
            <EmptyState icon={Loader2} title="No payments data" description="Payments report appears after selection." />
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;