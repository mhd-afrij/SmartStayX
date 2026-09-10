import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Table, Card } from '../../components/ui/States';
import { SkeletonCard, EmptyState, ErrorState } from '../../components/ui/States';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const AuditLogs = () => {
  const { axios, getToken } = useAppContext();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedActor, setSelectedActor] = useState('');

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get('/api/admin/audit-logs', {
        params: { module: selectedModule || undefined, actor: selectedActor || undefined, page, limit: 20 },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch {
      // silently ignore, keep state
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedModule, selectedActor]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Audit Logs</h1>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Platform-wide activity audit trail.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] focus:border-[#A67C52]/60 transition-colors"
        >
          <option value="">All modules</option>
          <option value="hotel_approval">Hotel approval</option>
          <option value="user_management">User management</option>
          <option value="hotel_creation">Hotel creation</option>
          <option value="booking_modification">Booking modification</option>
        </select>
        <select
          value={selectedActor}
          onChange={(e) => setSelectedActor(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] focus:border-[#A67C52]/60 transition-colors"
        >
          <option value="">All actors</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      {loading ? (
        <div className="p-8">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-slate-300 dark:text-[#A9AEA7] animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <EmptyState icon={Loader2} title="No audit logs yet" description="Activity logs appear here as actions are performed." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <Table data={logs} columns={[
            { key: 'action', label: 'Action' },
            { key: 'module', label: 'Module' },
            { key: 'actor', label: 'Actor' },
            { key: 'recordId', label: 'Record ID' },
            { key: 'createdAt', label: 'Time' },
            { key: 'ip', label: 'IP' },
          ]} />
        </Card>
      )}
    </div>
  );
};

export default AuditLogs;