import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Table, Card } from '../../components/ui/States';
import { SkeletonCard, ErrorState, EmptyState } from '../../components/ui/States';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

const SecurityCenter = () => {
  const { axios, getToken } = useAppContext();
  const [overview, setOverview] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  const [failedLogins, setFailedLogins] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [suspicious, setSuspicious] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const fetchOverview = async () => {
    try {
      const { data } = await axios.get('/api/security/overview', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setOverview(data.overview);
    } catch {}
  };

  const fetchLoginHistory = async () => {
    try {
      const { data } = await axios.get('/api/security/login-history?limit=20', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setLoginHistory(data.events || []);
    } catch {}
  };

  const fetchFailedLogins = async () => {
    try {
      const { data } = await axios.get('/api/security/failed-logins?limit=20', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setFailedLogins(data.events || []);
    } catch {}
  };

  const fetchSessions = async () => {
    try {
      const { data } = await axios.get('/api/security/sessions?limit=20', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setSessions(data.sessions || []);
    } catch {}
  };

  const fetchSuspicious = async () => {
    try {
      const { data } = await axios.get(`/api/security/suspicious?severity=${selectedSeverity}&limit=20`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setSuspicious(data.events || []);
    } catch {}
  };

  useEffect(() => {
    fetchOverview();
    fetchLoginHistory();
    fetchFailedLogins();
    fetchSessions();
    fetchSuspicious();
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Security Center</h1>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Monitor and manage platform security events.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Logins Today</p>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#F2EFE8]" id="logins-today">{overview?.loginsToday || 0}</div>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Suspicious Activity</p>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#F2EFE8]" id="suspicious-count">{overview?.suspicious || 0}</div>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Failed Logins</p>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#F2EFE8]" id="failed-logins-count">{overview?.failed || 0}</div>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Active Users</p>
          <div className="text-3xl font-bold text-slate-900 dark:text-[#F2EFE8]" id="active-users-count">{overview?.activeUsers || 0}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Login History</h2>
          {loading ? (
            <div className="p-8">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 text-slate-300 dark:text-[#A9AEA7] animate-spin" />
                <span className="ml-2">Loading...</span>
              </div>
            </div>
          ) : loginHistory.length === 0 ? (
            <EmptyState icon={Loader2} title="No login history yet" description="Logs appear here as users sign in." />
          ) : (
            <Table data={loginHistory} columns={[
              { key: 'user', label: 'User' },
              { key: 'ip', label: 'IP' },
              { key: 'createdAt', label: 'Time' },
            ]} />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Failed Logins</h2>
          {failedLogins.length === 0 ? (
            <EmptyState icon={Loader2} title="No failed logins yet" description="Failed login attempts recorded." />
          ) : (
            <Table data={failedLogins} columns={[
              { key: 'user', label: 'User' },
              { key: 'ip', label: 'IP' },
              { key: 'createdAt', label: 'Time' },
            ]} />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Active Sessions</h2>
          {sessions.length === 0 ? (
            <EmptyState icon={Loader2} title="No active sessions" description="Current logged-in sessions." />
          ) : (
            <Table data={sessions} columns={[
              { key: 'user', label: 'User' },
              { key: 'ip', label: 'IP' },
              { key: 'createdAt', label: 'Last activity' },
            ]} />
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Suspicious Activity</h2>
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] placeholder:text-[#72766F] dark:placeholder:text-[#A9AEA7] focus:border-[#A67C52]/60 transition-colors"
          >
            <option value="all">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          {suspicious.length === 0 ? (
            <EmptyState icon={Loader2} title="No suspicious events" description="Suspicious events filtered by severity." />
          ) : (
            <Table data={suspicious} columns={[
              { key: 'user', label: 'User' },
              { key: 'ip', label: 'IP' },
              { key: 'severity', label: 'Severity' },
              { key: 'createdAt', label: 'Time' },
            ]} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityCenter;