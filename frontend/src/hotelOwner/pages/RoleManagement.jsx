import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useClerk } from "@clerk/clerk-react";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";
import { ShieldCheck, Search, UserCog, Plus, Trash2, X, Link2 } from "lucide-react";
import ConfirmModal from "../../components/dashboard/ConfirmModal";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner", color: "border-[#2563EB]/20 bg-[#2563EB]/10 text-[#2563EB]" },
  { value: "receptionist", label: "Receptionist", color: "border-indigo-200 bg-indigo-50 text-indigo-600" },
  { value: "none", label: "No Access", color: "border-red-200 bg-red-50 text-red-600" },
];

const RoleManagement = () => {
  const { axios, getToken, refreshUser } = useAppContext();
  const clerk = useClerk();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [assigningId, setAssigningId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const { data } = await axios.get(`/api/user/search?email=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setUsers(data.users || []);
      } else {
        toast.error(data.message || "No users found");
      }
    } catch {
      toast.error("Failed to search users");
    } finally {
      setSearching(false);
    }
  }, [query, axios, getToken]);

  const handleAssignRole = async (userId, role) => {
    setAssigningId(userId);
    try {
      const { data } = await axios.post("/api/user/assign-role", { userId, role }, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(`Role set to ${role}`);
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role } : u)));
        refreshUser();
      } else {
        toast.error(data.message || "Failed to assign role");
      }
    } catch {
      toast.error("Failed to assign role");
    } finally {
      setAssigningId(null);
    }
  };

  const handleInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return toast.error("Enter an email address");

    clerk.openSignUp({
      initialValues: { emailAddress: inviteEmail },
      afterSignUpUrl: "/owner/role-management",
    });
    setShowModal(false);
    setInviteEmail("");
    toast.success("Clerk sign-up opened — after registration, search for the user to assign their role.");
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/sign-up`;
    navigator.clipboard.writeText(url);
    toast.success("Invite link copied!");
    setShowModal(false);
    setInviteEmail("");
  };

  const handleDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return;
    setDeletingId(id);
    setConfirmDelete({ open: false, id: null });
    try {
      const { data } = await axios({
        method: "delete",
        url: `/api/user/${id}`,
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("User deleted");
        setUsers((prev) => prev.filter((u) => u._id !== id));
        refreshUser();
      } else {
        toast.error(data.message || "Failed to delete user");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to delete user";
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Role Management</h1>
          <p className="text-sm text-slate-400 mt-1">
            Search users and assign Owner or Receptionist roles. New users sign up via Clerk, then manage their role here.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="gold-button flex items-center gap-2 px-4 py-2.5 text-xs"
        >
          <Plus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="luxury-input text-sm pl-10"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="gold-button px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="luxury-card overflow-hidden">
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 text-sm">
              {searching ? "Searching..." : "Search for a user or create a new one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/[0.06] bg-[#f4f2ef]">
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="py-3 px-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const currentRole = ROLE_OPTIONS.find((r) => r.value === user.role) || ROLE_OPTIONS[3];
                  return (
                    <tr key={user._id} className="border-b border-black/[0.06] hover:bg-black/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#2563EB]/5 border border-black/[0.06] flex items-center justify-center">
                            <UserCog className="w-4 h-4 text-[#2563EB]/70" />
                          </div>
                          <span className="text-sm font-medium text-slate-900">{user.name || user.username || "User"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{user.email || "—"}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${currentRole.color}`}>
                          {currentRole.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={user.role}
                            onChange={(e) => handleAssignRole(user._id, e.target.value)}
                            disabled={assigningId === user._id}
                            className="appearance-none pl-2.5 pr-6 py-1.5 text-xs rounded-lg border border-black/[0.08] bg-white text-slate-600 outline-none focus:border-[#2563EB]/40 transition-colors cursor-pointer disabled:opacity-40"
                          >
                            {ROLE_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => setConfirmDelete({ open: true, id: user._id })}
                            disabled={deletingId === user._id}
                            className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all disabled:opacity-40"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>



      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 space-y-5 shadow-2xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Invite User</h3>
                <p className="text-sm text-slate-400">
                  Add a user via Clerk sign-up or share an invite link.
                </p>
              </div>
              <button type="button" onClick={() => setShowModal(false)} className="p-1 rounded-lg hover:bg-black/[0.04] transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-500 mb-1.5 block">Email address</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite(e)}
                className="luxury-input text-sm"
                placeholder="newuser@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleInvite}
                disabled={!inviteEmail.trim()}
                className="gold-button flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Open Clerk Sign-up
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="ghost-button flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm"
              >
                <Link2 className="w-4 h-4" />
                Copy Invite Link
              </button>
            </div>

            <p className="text-xs text-slate-400 text-center">
              After sign-up, search for the user below to assign their role.
            </p>
          </motion.div>
        </div>
      )}

      <ConfirmModal
        open={confirmDelete.open}
        title="Delete User"
        message="Delete this user account? This action cannot be undone."
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </motion.div>
  );
};

export default RoleManagement;
