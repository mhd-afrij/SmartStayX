import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Input, Select, Toggle } from '../../components/ui/Field';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard, EmptyState, ErrorState } from '../../components/ui/States';
import { Loader2 } from 'lucide-react';

const PlatformSettings = () => {
  const { axios, getToken, getPlatformSettings } = useAppContext();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [retentionDays, setRetentionDays] = useState(365);
  const [archiveCritical, setArchiveCritical] = useState(false);

  const loadSettings = async () => {
    try {
      const { data } = await axios.get('/api/admin/settings', {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setSettings(data.settings);
    } catch {
      // keep existing
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData(e.target);
      const payload = Object.fromEntries(formData.entries());
      await axios.put('/api/admin/settings', payload, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      toast.success('Settings updated');
      loadSettings();
    } catch {
      toast.error('Failed to update settings');
    }
  };

  const runRetention = async () => {
    try {
      await axios.post('/api/admin/settings/run-audit-retention', {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      toast.success('Audit retention sweep completed');
    } catch {
      toast.error('Audit retention sweep failed');
    }
  };

  if (!settings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Platform Settings</h1>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Global configuration for the SmartStayX platform.</p>
      </div>

      <Card padded={false} className="overflow-hidden">
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 dark:text-[#A9AEA7] mb-1">Platform Name</label>
              <Input
                value={settings.platformName || ''}
                onChange={(e) => { /* handled in payload */ }}
                placeholder="SmartStayX"
                disabled
                className="bg-transparent cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-500 dark:text-[#A9AEA7] mb-1">Commission Rate (%)</label>
              <Input
                type="number"
                value={String(settings.commissionRate || 10)}
                onChange={(e) => { /* handled in payload */ }}
                min="0"
                max="100"
                placeholder="10"
                className="w-full"
              />
            </div>
          </div>

          <fieldset className="mt-4">
            <legend className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7]">Audit Log Retention</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-500 dark:text-[#A9AEA7] mb-1">Retention Days</label>
                <Input
                  type="number"
                  value={String(settings.auditLog?.retentionDays || 365)}
                  onChange={(e) => {
                    const v = Math.min(3650, Math.max(30, Number(e.target.value)));
                    setRetentionDays(v);
                  }}
                  min="30"
                  max="3650"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 dark:text-[#A9AEA7] mb-1">Archive Critical Modules</label>
                <Toggle
                  checked={settings.auditLog?.archiveCritical !== false}
                  onChange={(checked) => setArchiveCritical(checked)}
                />
              </div>
            </div>
          </fieldset>

          <Button type="submit" className="w-full mt-4">
            Save Settings
          </Button>
        </form>
      </Card>

      <div className="mt-6">
        <h2 className="text-sm font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">Audit Retention Sweep</h2>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mb-3">Purges logs older than retentionDays except critical modules when archiveCritical is enabled.</p>
        <Button onClick={runRetention} className="w-full mt-2">
          Run Retention Sweep
        </Button>
        {showRetentionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white dark:bg-[#1A1E1B] rounded-xl p-6 max-w-sm">
              <p>Archive critical modules? (details in UI)</p></div></div>
        )}
      </div>
    </div>
  );
};

export default PlatformSettings;