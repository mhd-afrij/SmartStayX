import { useEffect, useState } from 'react';
import { ShieldCheck, Plus, Pencil, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import Button, { IconButton } from '../../components/ui/Button';
import { Input, Select, Textarea } from '../../components/ui/Field';
import Badge from '../../components/ui/Badge';
import { Skeleton, EmptyState, ErrorState } from '../../components/ui/States';
import ConfirmModal from '../../components/dashboard/ConfirmModal';

const ACCESS_TONES = { owner: 'confirmed', receptionist: 'progress', none: 'neutral' };

const emptyForm = { name: '', description: '', dashboardAccess: 'none' };

const RoleFormModal = ({ open, initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(initial || emptyForm);
  }, [open, initial]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
        onClick={onCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md mx-4"
        >
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-semibold text-[#0F172A]">{initial ? 'Edit role' : 'New role'}</h3>
            <Input
              label="Role name"
              required
              disabled={!!initial}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. concierge"
              helper={initial ? 'Role names cannot be changed after creation.' : undefined}
            />
            <Textarea
              label="Description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
            <Select
              label="Dashboard access"
              value={form.dashboardAccess}
              onChange={(e) => setForm((f) => ({ ...f, dashboardAccess: e.target.value }))}
            >
              <option value="none">None</option>
              <option value="owner">Owner</option>
              <option value="receptionist">Receptionist</option>
            </Select>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium rounded-xl border border-black/[0.08] text-slate-500 hover:text-slate-900 hover:bg-[#f4f2ef] transition-all"
              >
                Cancel
              </button>
              <Button loading={saving} disabled={!form.name.trim()} onClick={() => onSave(form)}>
                {initial ? 'Save changes' : 'Create role'}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const RoleManagement = () => {
  const { axios } = useAppContext();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get('/api/roles');
      if (data.success) setRoles(data.roles);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (role) => {
    setEditing(role);
    setFormOpen(true);
  };

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const { data } = editing
        ? await axios.put(`/api/roles/${editing._id}`, form)
        : await axios.post('/api/roles', form);
      if (data.success) {
        setFormOpen(false);
        fetchRoles();
      } else {
        window.alert(data.message || 'Failed to save role');
      }
    } catch {
      window.alert('Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const { data } = await axios.delete(`/api/roles/${deleteTarget._id}`);
      if (data.success) {
        setRoles((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      } else {
        window.alert(data.message || 'Failed to delete role');
      }
    } catch {
      window.alert('Failed to delete role');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Role Management"
        description="Define custom roles and their dashboard access levels."
        actions={<Button icon={Plus} onClick={openCreate}>New role</Button>}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : error ? (
        <ErrorState description="Could not load roles." onRetry={fetchRoles} />
      ) : roles.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="No roles yet" description="Create your first custom role." />
      ) : (
        <Card padded={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Name</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Description</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Dashboard access</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-[#64748B] uppercase tracking-wider">Users</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-[#64748B] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role._id} className="border-b border-[#E2E8F0] last:border-b-0 hover:bg-[#F1F5F9] transition-colors">
                    <td className="py-3 px-4 font-medium text-[#0F172A]">{role.name}</td>
                    <td className="py-3 px-4 text-[#64748B]">{role.description || '—'}</td>
                    <td className="py-3 px-4">
                      <Badge tone={ACCESS_TONES[role.dashboardAccess] || 'neutral'}>{role.dashboardAccess}</Badge>
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">{role.userCount ?? 0}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton icon={Pencil} variant="ghost" size="sm" label="Edit role" onClick={() => openEdit(role)} />
                        <IconButton
                          icon={Trash2}
                          variant="ghost"
                          size="sm"
                          label="Delete role"
                          className="text-[#DC2626] hover:bg-red-50"
                          onClick={() => setDeleteTarget(role)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <RoleFormModal
        open={formOpen}
        initial={editing}
        onSave={handleSave}
        onCancel={() => setFormOpen(false)}
        saving={saving}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title="Delete role"
        message={deleteTarget ? `Delete the "${deleteTarget.name}" role? Users with this role will be reset.` : ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default RoleManagement;
