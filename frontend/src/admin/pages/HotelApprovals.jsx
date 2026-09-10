import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Table, Card } from '../../components/ui/States';
import { SkeletonCard, EmptyState, ErrorState } from '../../components/ui/States';
import toast from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const HotelApprovals = () => {
  const { axios, getToken } = useAppContext();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [confirmState, setConfirmState] = useState({ open: false, id: null, title: '', message: '' });

  const fetchHotels = async () => {
    try {
      const { data } = await axios.get('/api/admin/hotel-approvals', {
        params: { status: statusFilter || undefined, limit: 20 },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setHotels(data.hotels || []);
    } catch {
      toast.error('Failed to load hotel approvals');
    }
  };

  useEffect(() => {
    fetchHotels();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    try {
      await axios.patch(`/api/admin/hotels/${id}/approval`, { status: 'approved', rejectionReason: '' }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      toast.success('Hotel approved');
      fetchHotels();
    } catch {
      toast.error('Failed to approve hotel');
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.patch(`/api/admin/hotels/${id}/approval`, { status: 'rejected', rejectionReason: 'Under review' }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      toast.success('Hotel rejected');
      fetchHotels();
    } catch {
      toast.error('Failed to reject hotel');
    }
  };

  const handleSuspend = async (id) => {
    try {
      await axios.patch(`/api/admin/hotels/${id}/approval`, { status: 'suspended' }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      toast.success('Hotel suspended');
      fetchHotels();
    } catch {
      toast.error('Failed to suspend hotel');
    }
  };

  const requestConfirm = (id, title, message) => {
    setConfirmState({ open: true, id, title, message });
  };
  const handleConfirmed = async () => {
    const { id } = confirmState;
    if (!id) return;
    if (confirmState.title.includes('approved')) await handleApprove(id);
    else if (confirmState.title.includes('rejected')) await handleReject(id);
    else if (confirmState.title.includes('suspended')) await handleSuspend(id);
    setConfirmState({ open: false, id: null, title: '', message: '' });
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-[#F2EFE8]">Hotel Approvals</h1>
        <p className="text-sm text-slate-500 dark:text-[#A9AEA7]">Manage pending hotel registrations and verifications.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-slate-600 dark:text-[#A9AEA7] focus:border-[#A67C52]/60 transition-colors"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="suspended">Suspended</option>
        </select>
        <Button
          onClick={() => setStatusFilter(statusFilter === 'all' ? 'pending' : 'all')}
          className="px-3 py-1.5 text-sm"
        >
          {statusFilter === 'all' ? 'Show pending' : 'Show all'}
        </Button>
      </div>

      {loading ? (
        <div className="p-8">
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 text-slate-300 dark:text-[#A9AEA7] animate-spin" />
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      ) : hotels.length === 0 ? (
        <EmptyState icon={Loader2} title="No pending hotels" description="Hotel registrations awaiting approval appear here." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <Table data={hotels} columns={[
            { key: 'name', label: 'Hotel Name' },
            { key: 'city', label: 'City' },
            { key: 'approvalStatus', label: 'Status' },
            { key: 'verifiedDocuments', label: 'Docs Verified', render: (h) => (h.verifiedDocuments ? 'Yes' : 'No') },
            { key: 'createdAt', label: 'Registered', render: (h) => (h.createdAt ? new Date(h.createdAt).toLocaleDateString() : '—') },
            {
              key: 'actions',
              label: 'Actions',
              render: (h) => (
                <div className="flex gap-1.5">
                  <Button onClick={() => requestConfirm(h._id, 'Approve hotel', `Approve ${h.name || 'this hotel'}?`)} className="px-2 py-1 text-xs">Approve</Button>
                  <Button onClick={() => requestConfirm(h._id, 'Reject hotel', `Reject ${h.name || 'this hotel'}?`)} variant="outline" className="px-2 py-1 text-xs">Reject</Button>
                  <Button onClick={() => requestConfirm(h._id, 'Suspend hotel', `Suspend ${h.name || 'this hotel'}?`)} variant="outline" className="px-2 py-1 text-xs">Suspend</Button>
                </div>
              ),
            },
          ]} />
        </Card>
      )}
    </div>
  );
};

export default HotelApprovals;