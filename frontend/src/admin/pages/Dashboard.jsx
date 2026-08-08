import { useEffect, useState } from 'react';
import { Users, Hotel, CalendarCheck, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/Card';
import { SkeletonCard, ErrorState } from '../../components/ui/States';

const Dashboard = () => {
  const { axios, getToken } = useAppContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setStats(data.stats);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <PageHeader title="Platform Overview" description="System-wide metrics across every hotel on SmartStayX." />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : error ? (
        <ErrorState description="Could not load platform stats." onRetry={fetchStats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.userCount} icon={Users} tone="primary" />
          <StatCard label="Hotels" value={stats.hotelCount} icon={Hotel} tone="success" />
          <StatCard label="Bookings" value={stats.bookingCount} icon={CalendarCheck} tone="gold" />
          <StatCard label="Roles Configured" value={stats.roleCount} icon={ShieldCheck} tone="primary" />
        </div>
      )}
    </div>
  );
};

export default Dashboard;
