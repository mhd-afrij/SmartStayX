import { useEffect, useState } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Field';
import { IconButton } from '../../components/ui/Button';
import { Skeleton, EmptyState, ErrorState } from '../../components/ui/States';
import ConfirmModal from '../../components/dashboard/ConfirmModal';

const ROLES = ['guest', 'receptionist', 'hotel_manager', 'super_admin'];
const STATUSES = ['active', 'suspended', 'pending'];

const UserManagement = () => {
  const { axios, user: currentUser } = useAppContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get('/api/admin/users', {
        params: { page, limit: 10, role: roleFilter || undefined, search: search || undefined },
      });
      if (data.success) {
        setUsers(data.users);
        setPages(data.pages || 1);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (page !== 1) setPage(1);
      else fetchUsers();
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const isSelf = (u) => currentUser?.id === u._id;

  const handleRoleChange = async (u, role) => {
    if (isSelf(u)) return;
    if (!window.confirm(`Change ${u.name}'s role to "${role}"?`)) return;
    setBusyId(u._id);
    try {
      const { data } = await axios.post('/api/user/assign-role', { userId: u._id, role });
      if (data.success) {
        setUsers((prev) => prev.map((item) => (item._id === u._id ? { ...item, role } : item)));
      } else {
        window.alert(data.message || 'Failed to update role');
      }
    } catch {
      window.alert('Failed to update role');
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (u, status) => {
    if (isSelf(u)) return;
    setBusyId(u._id);
    try {
      const { data } = await axios.patch(`/api/admin/users/${u._id}/status`, { status });
      if (data.success) {
        setUsers((prev) => prev.map((item) => (item._id === u._id ? { ...item, status } : item)));
      } else {
        window.alert(data.message || 'Failed to update status');
      }
    } catch {
      window.alert('Failed to update status');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setBusyId(deleteTarget._id);
    try {
      const { data } = await axios.delete(`/api/user/${deleteTarget._id}`);
      if (data.success) {
        setUsers((prev) => prev.filter((item) => item._id !== deleteTarget._id));
      } else {
        window.alert(data.message || 'Failed to delete user');
      }
    } catch {
      window.alert('Failed to delete user');
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader title="User Management" description="View, filter, and manage every account on SmartStayX." />

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-[#E8E0D1] dark:border-[#232737]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#879497] dark:text-[#6B828A]" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 text-xs rounded-lg border border-[#E8E0D1] dark:border-[#232737] bg-white dark:bg-[#161925] text-[#003844] dark:text-[#E9F1F2] placeholder:text-[#879497] dark:placeholder:text-[#6B828A] outline-none focus:border-[#D4A853]/60 transition-colors"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setPage(1);
              setRoleFilter(e.target.value);
            }}
            className="!h-9 !text-xs w-40"
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState description="Could not load users." onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <EmptyState icon={Users} title="No users found" description="Try adjusting your search or filter." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E8E0D1] dark:border-[#232737] bg-[#FFFAF4] dark:bg-[#10131D]">
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">User</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Role</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Status</th>
                    <th className="py-3 px-4 text-left text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Joined</th>
                    <th className="py-3 px-4 text-right text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const self = isSelf(u);
                    return (
                      <tr key={u._id} className="border-b border-[#E8E0D1] dark:border-[#232737] last:border-b-0 hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {u.image ? (
                              <img src={u.image} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075] flex items-center justify-center text-xs font-semibold">
                                {u.name?.charAt(0)?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-[#003844] dark:text-[#E9F1F2] truncate">{u.name}{self && <span className="ml-1.5 text-[10px] text-[#879497] dark:text-[#6B828A] font-normal">(you)</span>}</p>
                              <p className="text-xs text-[#4D6166] dark:text-[#9FB2B8] truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={u.role}
                            disabled={self || busyId === u._id}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className="h-8 rounded-lg border border-[#E8E0D1] dark:border-[#232737] bg-white dark:bg-[#161925] px-2 text-xs text-[#003844] dark:text-[#E9F1F2] outline-none focus:border-[#D4A853]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={u.status || 'active'}
                            disabled={self || busyId === u._id}
                            onChange={(e) => handleStatusChange(u, e.target.value)}
                            className="h-8 rounded-lg border border-[#E8E0D1] dark:border-[#232737] bg-white dark:bg-[#161925] px-2 text-xs text-[#003844] dark:text-[#E9F1F2] outline-none focus:border-[#D4A853]/60 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-[#4D6166] dark:text-[#9FB2B8] text-xs">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <IconButton
                            icon={Trash2}
                            variant="ghost"
                            size="sm"
                            label="Delete user"
                            disabled={self || busyId === u._id}
                            onClick={() => setDeleteTarget(u)}
                            className="text-[#DC2626] hover:bg-red-50 disabled:opacity-30"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t border-[#E8E0D1] dark:border-[#232737]">
                <span className="text-xs text-[#879497] dark:text-[#6B828A]">Page {page} of {pages}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-[#E8E0D1] dark:border-[#232737] text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2] hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pages, p + 1))}
                    disabled={page >= pages}
                    className="p-1.5 rounded-lg border border-[#E8E0D1] dark:border-[#232737] text-[#879497] dark:text-[#6B828A] hover:text-[#003844] dark:hover:text-[#E9F1F2] hover:bg-[#F3ECDE] dark:hover:bg-[#232737] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete user"
        message={deleteTarget ? `Are you sure you want to permanently delete ${deleteTarget.name}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default UserManagement;
