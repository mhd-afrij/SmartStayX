import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import Badge from "../../components/ui/Badge";
import {
  CalendarCheck,
  Users,
  LogIn,
  LogOut,
  Wallet,
  ConciergeBell,
  Bell,
  ArrowRight,
  Sparkles,
  Building2,
} from "lucide-react";
import toast from "react-hot-toast";

const STATUS_BADGE = {
  pending: { label: "Pending", tone: "pending" },
  reservation: { label: "Reserved", tone: "pending" },
  confirmed: { label: "Confirmed", tone: "confirmed" },
  checked_in: { label: "Checked-in", tone: "checkedIn" },
  checked_out: { label: "Completed", tone: "completed" },
  cancelled: { label: "Cancelled", tone: "cancelled" },
  expired: { label: "Expired", tone: "expired" },
};

const FrontDesk = () => {
  const navigate = useNavigate();
  const { axios, getToken, formatPrice, user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [reservations, setReservations] = useState([]);
  const [services, setServices] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("/api/receptionist/dashboard", {
          headers: { Authorization: `Bearer ${await getToken()}` },
        });
        if (data.success) {
          setSummary(data.summary || null);
          setReservations(data.reservations || []);
          setServices(data.services || []);
          setNotifications(data.notifications || []);
        } else {
          toast.error(data.message || "Failed to load dashboard");
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const quickActions = [
    { label: "New Reservation", icon: CalendarCheck, to: "/receptionist/reservations?new=1", accent: "bg-[#183B35] text-[#F2EFE8]" },
    { label: "Walk-in Guest", icon: Users, to: "/receptionist/reservations?new=1&walkin=1", accent: "bg-[#A67C52] text-white" },
    { label: "Check-in Guest", icon: LogIn, to: "/receptionist/checkin", accent: "bg-green-700 text-white" },
    { label: "Check-out Guest", icon: LogOut, to: "/receptionist/checkout", accent: "bg-[#8A643F] text-white" },
    { label: "Add Guest", icon: Users, to: "/receptionist/guests", accent: "bg-indigo-700 text-white" },
    { label: "Collect Payment", icon: Wallet, to: "/receptionist/payments", accent: "bg-[#183B35] text-[#F2EFE8]" },
  ];

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      {/* Welcome banner */}
      <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-gradient-to-br from-[#183B35] to-[#0F2622] dark:from-[#183B35] dark:to-[#0F2622] p-6 text-[#F2EFE8] relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-[#A67C52]/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-[#C5A47E]">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs uppercase tracking-[0.2em]">{today}</span>
          </div>
          <h1 className="mt-2 text-2xl lg:text-3xl font-bold tracking-tight">Welcome, {user?.username || "Receptionist"}</h1>
          <p className="mt-1 text-sm text-[#C9D6CE]">Here's what's happening at the front desk today.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" />
          <span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading dashboard...</span>
        </div>
      ) : (
        <>
          {/* Quick Actions */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8] mb-1">Quick Actions</h2>
            <p className="text-xs text-slate-500 dark:text-[#A9AEA7] mb-4">One-click access for common front-desk operations.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.to)}
                    className={`group flex items-center gap-2.5 rounded-xl px-3 py-3 text-left text-sm font-medium shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${action.accent}`}
                  >
                    <Icon className="w-4 h-4 shrink-0 opacity-90" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Overview */}
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Rooms */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8]">Rooms</h3>
                <Building2 className="w-4 h-4 text-[#A67C52]" />
              </div>
              <div className="space-y-2.5">
                <OverviewRow label="Available" value={summary?.rooms?.available || 0} tone="text-green-600 dark:text-green-300" />
                <OverviewRow label="Occupied" value={summary?.rooms?.occupied || 0} tone="text-[#8A643F] dark:text-[#C5A47E]" />
                <OverviewRow label="Cleaning" value={summary?.rooms?.cleaning || 0} tone="text-purple-600 dark:text-purple-300" />
                <OverviewRow label="Maintenance" value={summary?.rooms?.maintenance || 0} tone="text-orange-600 dark:text-orange-300" />
              </div>
            </div>

            {/* Guests */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8]">Guests</h3>
                <Users className="w-4 h-4 text-[#A67C52]" />
              </div>
              <div className="space-y-2.5">
                <OverviewRow label="Arrivals" value={summary?.guests?.arrivalsToday || 0} tone="text-green-600 dark:text-green-300" />
                <OverviewRow label="Departures" value={summary?.guests?.departuresToday || 0} tone="text-[#8A643F] dark:text-[#C5A47E]" />
                <OverviewRow label="In House" value={summary?.guests?.inHouse || 0} tone="text-indigo-600 dark:text-indigo-300" />
                <OverviewRow label="Pending check-ins" value={summary?.guests?.pendingCheckins || 0} tone="text-amber-600 dark:text-amber-300" />
              </div>
            </div>

            {/* Payments */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8]">Payments</h3>
                <Wallet className="w-4 h-4 text-[#A67C52]" />
              </div>
              <div className="space-y-2.5">
                <OverviewRow label="Pending" value={formatPrice(summary?.payments?.pendingRevenue || 0)} tone="text-amber-600 dark:text-amber-300" />
                <OverviewRow label="Collected" value={formatPrice(summary?.payments?.collectedRevenue || 0)} tone="text-green-600 dark:text-green-300" />
                <OverviewRow label="Pending invoices" value={summary?.payments?.pendingCount || 0} tone="text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </div>
{/* Recent reservations */}
          <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-black/[0.06] dark:border-[#303631] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8]">Recent Reservations</h3>
                <p className="text-xs text-slate-500 dark:text-[#A9AEA7]">Latest guest bookings</p>
              </div>
              <button onClick={() => navigate("/receptionist/reservations")} className="flex items-center gap-1 text-xs text-[#183B35] dark:text-[#8FB8A8] hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            {reservations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-[#A9AEA7] text-sm">No reservations found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#EFEEE8] dark:bg-[#222823] border-b border-black/[0.06] dark:border-[#303631]">
                      {["Guest", "Room", "Dates", "Status", "Action"].map((h) => (
                        <th key={h} className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((r) => {
                      const st = STATUS_BADGE[r.status] || STATUS_BADGE.pending;
                      return (
                        <tr key={r._id} className="border-b border-black/[0.06] dark:border-[#303631] hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-[#EFEEE8] dark:bg-[#222823] border border-black/[0.06] dark:border-[#303631] flex items-center justify-center">
                                <span className="text-[10px] font-medium text-slate-600 dark:text-[#A9AEA7]">{r.guestName?.charAt(0)?.toUpperCase()}</span>
                              </div>
                              <span className="text-slate-700 dark:text-[#E8EDE6]">{r.guestName}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-[#A9AEA7]">
                            {r.roomNumber ? `Room ${r.roomNumber}` : (r.roomType || "—")}
                          </td>
                          <td className="py-3 px-4 text-slate-500 dark:text-[#A9AEA7] font-space text-xs">
                            {r.checkInDate ? new Date(r.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""} – {r.checkOutDate ? new Date(r.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}
                          </td>
                          <td className="py-3 px-4"><Badge tone={st.tone}>{st.label}</Badge></td>
                          <td className="py-3 px-4">
                            {r.status === "confirmed" && (
                              <button
                                onClick={() => navigate(`/receptionist/checkin?bookingId=${r._id}`)}
                                className="px-2.5 py-1 text-[10px] rounded-lg border border-green-200 dark:border-green-500/25 bg-green-50 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-500/10 transition-all"
                              >
                                Check-in
                              </button>
                            )}
                            {r.status === "checked_in" && (
                              <button
                                onClick={() => navigate(`/receptionist/checkout?bookingId=${r._id}`)}
                                className="px-2.5 py-1 text-[10px] rounded-lg border border-[#A67C52]/45 dark:border-[#303631]/45 bg-[#EFEAE1] dark:bg-[#222823] text-[#183B35] dark:text-[#8FB8A8] transition-all"
                              >
                                Check-out
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
<div className="grid gap-4 lg:grid-cols-2">
            {/* Recent guest requests */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ConciergeBell className="w-4 h-4 text-[#A67C52]" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8]">Recent Guest Requests</h3>
                </div>
                <button onClick={() => navigate("/receptionist/services")} className="text-xs text-[#183B35] dark:text-[#8FB8A8] hover:underline">View all</button>
              </div>
              {services.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-[#A9AEA7]">No service requests yet.</p>
              ) : (
                <div className="space-y-2">
                  {services.map((s) => (
                    <div key={s._id} className="flex items-center justify-between gap-3 rounded-lg border border-black/[0.06] dark:border-[#303631] bg-[#EFEEE8]/60 dark:bg-[#222823]/60 px-3 py-2.5">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-[#E8EDE6] truncate">{s.serviceType}</p>
                        <p className="text-[11px] text-slate-500 dark:text-[#A9AEA7] truncate">
                          {s.guest?.name || s.guest?.username || "Guest"} · Room {s.roomNumber || s.room?.roomNumber || "—"}
                        </p>
                      </div>
                      <Badge tone={s.status === "completed" ? "completed" : s.status === "cancelled" ? "cancelled" : "pending"}>{s.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications feed */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#A67C52]" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8]">Notifications</h3>
                  {summary?.notifications?.unread > 0 && (
                    <span className="h-5 min-w-5 px-1 flex items-center justify-center rounded-full bg-[#A67C52] dark:bg-[#C5A47E] text-white dark:text-[#1A1E1B] text-[10px] font-bold">
                      {summary.notifications.unread}
                    </span>
                  )}
                </div>
                <button onClick={() => navigate("/receptionist/notifications")} className="text-xs text-[#183B35] dark:text-[#8FB8A8] hover:underline">View all</button>
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-[#A9AEA7]">No notifications yet.</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div key={n._id} className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 ${n.isRead ? "border-transparent" : "border-[#A67C52]/30 bg-[#F6EFE3] dark:bg-[#222823]"}`}>
                      <div className="mt-0.5">
                        {n.type === "check_out" ? (
                          <LogOut className="w-3.5 h-3.5 text-[#8A643F] dark:text-[#C5A47E]" />
                        ) : n.type === "check_in" ? (
                          <LogIn className="w-3.5 h-3.5 text-green-600 dark:text-green-300" />
                        ) : n.type === "new_booking" ? (
                          <CalendarCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
                        ) : (
                          <Bell className="w-3.5 h-3.5 text-[#A67C52]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-800 dark:text-[#E8EDE6]">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-[#A9AEA7]">{n.message}</p>
                      </div>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#A67C52] dark:bg-[#C5A47E] shrink-0 mt-1" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

const OverviewRow = ({ label, value, tone }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-slate-500 dark:text-[#A9AEA7]">{label}</span>
    <span className={`text-sm font-semibold ${tone}`}>{value}</span>
  </div>
);

export default FrontDesk;
