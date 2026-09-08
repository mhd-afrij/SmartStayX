import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { Users, UserCog, ShieldCheck, Search, Activity, CalendarCheck } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import { Skeleton, EmptyState, ErrorState } from "../../components/ui/States";

// Roles an owner may assign (must exist in the backend Role collection).
const ASSIGNABLE_ROLES = [
  { value: "hotel_manager", label: "Hotel Manager" },
  { value: "receptionist", label: "Receptionist" },
  { value: "none", label: "No Access" },
];

const ROLE_BADGE = {
  hotel_manager: "border-[#D4A853]/40 bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075]",
  super_admin: "border-red-200 dark:border-red-500/25 bg-red-50 text-red-600 dark:text-red-300",
  receptionist: "border-indigo-200 bg-indigo-50 text-indigo-600",
  none: "border-slate-200 dark:border-[#232737] bg-slate-100 dark:bg-[#10131D] text-slate-500 dark:text-[#8299A0]",
};

// Show the user's current role even when it isn't assignable (staff/admin),
// so the dropdown never renders a misleading first option.
const roleOptionsFor = (current) => {
  if (ASSIGNABLE_ROLES.some((r) => r.value === current)) return ASSIGNABLE_ROLES;
  return [
    ...ASSIGNABLE_ROLES,
    { value: current, label: current.charAt(0).toUpperCase() + current.slice(1), locked: true },
  ];
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const StatCard = ({ icon: Icon, label, value, tone = "bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075]" }) => (
  <div className="rounded-2xl border border-black/[0.06] dark:border-[#232737] bg-white dark:bg-[#161925] p-5 flex items-center gap-4">
    <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center ${tone}`}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-medium text-slate-500 dark:text-[#8299A0] uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold text-slate-900 dark:text-[#E9F1F2]">{value}</p>
    </div>
  </div>
);

const StaffManagement = () => {
  const { axios, getToken, refreshUser } = useAppContext();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [assigningId, setAssigningId] = useState(null);

  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const { data } = await axios.get("/api/user/team", {
        params: { search: search || undefined, role: roleFilter || undefined, limit: 200 },
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setUsers(data.users || []);
        setTotal(data.total || 0);
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [axios, getToken, search, roleFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => fetchTeam(), 300);
    return () => clearTimeout(timeout);
  }, [fetchTeam]);

  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);
    try {
      const { data } = await axios.get("/api/user/team/activity?limit=20", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setActivity(data.activity || []);
    } catch {
      // activity feed is non-critical
    } finally {
      setActivityLoading(false);
    }
  }, [axios, getToken]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleAssignRole = async (userId, role) => {
    if (!role) return;
    setAssigningId(userId);
    try {
      const { data } = await axios.post(
        "/api/user/assign-role",
        { userId, role },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
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

  const counts = {
    owners: users.filter((u) => u.role === "hotel_manager").length,
    receptionists: users.filter((u) => u.role === "receptionist").length,
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-[#E9F1F2] tracking-tight">Staff Management</h1>
        <p className="text-sm text-slate-500 dark:text-[#8299A0] mt-1">
          Manage your hotel team — employee list, roles, and recent activity.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Users} label="Team members" value={total} tone="bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075]" />
        <StatCard icon={ShieldCheck} label="Owners" value={counts.owners} tone="bg-[#F3ECDE] dark:bg-[#10131D] text-[#B58A2E] dark:text-[#E6C075]" />
        <StatCard icon={UserCog} label="Front desk" value={counts.receptionists} tone="bg-indigo-50 text-indigo-600 dark:bg-[#1B2436] dark:text-indigo-300" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Employee list */}
        <div className="lg:col-span-2 rounded-2xl border border-black/[0.06] dark:border-[#232737] bg-white dark:bg-[#161925] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-black/[0.06] dark:border-[#232737]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#6B828A]" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-64 pl-9 pr-3 py-2 text-xs rounded-lg border border-black/[0.08] dark:border-[#232737] bg-white dark:bg-[#10131D] text-slate-700 dark:text-[#E9F1F2] placeholder:text-slate-400 dark:placeholder:text-[#6B828A] outline-none focus:border-[#D4A853]/60 transition-colors"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-lg border border-black/[0.08] dark:border-[#232737] bg-white dark:bg-[#10131D] text-slate-600 dark:text-[#9FB2B8] outline-none focus:border-[#D4A853]/60 cursor-pointer"
            >
              <option value="">All roles</option>
              <option value="hotel_manager">Hotel Manager</option>
              <option value="receptionist">Receptionist</option>
              <option value="super_admin">Super Admin</option>
              <option value="none">No access</option>
            </select>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <ErrorState description="Could not load the team." onRetry={fetchTeam} />
          ) : users.length === 0 ? (
            <EmptyState icon={Users} title="No team members found" description="Try adjusting your search or role filter." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-[#232737] bg-[#f4f2ef] dark:bg-[#10131D] text-slate-500 dark:text-[#8299A0] text-xs uppercase tracking-[0.15em]">
                    <th className="py-3 px-4 text-left font-medium">Employee</th>
                    <th className="py-3 px-4 text-left font-medium">Role</th>
                    <th className="py-3 px-4 text-left font-medium hidden md:table-cell">Status</th>
                    <th className="py-3 px-4 text-left font-medium hidden sm:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const options = roleOptionsFor(u.role);
                    const locked = options.some((o) => o.locked);
                    return (
                      <tr key={u._id} className="border-b border-black/[0.06] dark:border-[#232737] last:border-b-0 hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {u.image ? (
                              <img src={u.image} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075] flex items-center justify-center text-xs font-semibold">
                                {u.name?.charAt(0)?.toUpperCase() || "?"}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-[#E9F1F2] truncate">{u.name || "—"}</p>
                              <p className="text-xs text-slate-500 dark:text-[#8299A0] truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {locked ? (
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border ${ROLE_BADGE[u.role] || ROLE_BADGE.none}`}>
                              {u.role}
                            </span>
                          ) : (
                            <select
                              value={u.role}
                              disabled={assigningId === u._id}
                              onChange={(e) => handleAssignRole(u._id, e.target.value)}
                              className="h-8 rounded-lg border border-black/[0.08] dark:border-[#232737] bg-white dark:bg-[#10131D] px-2 text-xs text-slate-700 dark:text-[#E9F1F2] outline-none focus:border-[#D4A853]/60 disabled:opacity-50 cursor-pointer"
                            >
                              {options.map((o) => (
                                <option key={o.value} value={o.value} disabled={o.locked}>{o.label}</option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium border ${
                            u.status === "active"
                              ? "border-green-200 dark:border-green-500/25 bg-green-50 text-green-700 dark:text-green-300"
                              : "border-red-200 dark:border-red-500/25 bg-red-50 text-red-600 dark:text-red-300"
                          }`}>
                            {u.status || "active"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-[#8299A0] hidden sm:table-cell">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="rounded-2xl border border-black/[0.06] dark:border-[#232737] bg-white dark:bg-[#161925] overflow-hidden">
          <div className="p-5 border-b border-black/[0.06] dark:border-[#232737] flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#B58A2E] dark:text-[#E6C075]" />
            <h3 className="font-semibold text-slate-900 dark:text-[#E9F1F2]">Recent activity</h3>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {activityLoading ? (
              <div className="p-5 space-y-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : activity.length === 0 ? (
              <div className="p-8 text-center">
                <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-[#4E646B]" />
                <p className="text-sm text-slate-400 dark:text-[#6B828A]">No staff activity yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.06] dark:divide-[#232737]">
                {activity.map((a, i) => (
                  <li key={a.id || i} className="flex items-start gap-3 px-5 py-3">
                    {a.actorImage ? (
                      <img src={a.actorImage} alt={a.actorName} className="w-7 h-7 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075] flex items-center justify-center text-[10px] font-semibold shrink-0">
                        {a.actorName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-800 dark:text-[#D3DFE2]">
                        <span className="font-medium">{a.actorName}</span>{" "}
                        <span className="text-slate-500 dark:text-[#8299A0]">{a.action}</span>
                      </p>
                      <p className="text-xs text-slate-400 dark:text-[#6B828A] truncate">{a.detail}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 dark:text-[#6B828A] shrink-0 mt-0.5">{timeAgo(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StaffManagement;
