import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, CheckCheck, Circle } from "lucide-react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const Notifications = () => {
  const { axios, getToken } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ limit: "50" });
      if (filter === "unread") params.set("unread", "true");
      const { data } = await axios.get(`/api/notifications?${params}`, { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } else {
        toast.error(data.message || "Failed to load notifications");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, [filter]);

  const markRead = async (id) => {
    try {
      const { data } = await axios.put(`/api/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) await loadNotifications();
      else toast.error(data.message || "Failed to update notification");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update notification");
    }
  };

  const markAllRead = async () => {
    try {
      const { data } = await axios.put("/api/notifications/read-all", {}, { headers: { Authorization: `Bearer ${await getToken()}` } });
      if (data.success) {
        toast.success("Notifications marked as read");
        await loadNotifications();
      } else {
        toast.error(data.message || "Failed to update notifications");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update notifications");
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#F2EFE8] tracking-tight">Notifications</h1>
          <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mt-1">Front desk alerts for reservations, payments, rooms, and service events.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="luxury-select h-auto py-2 px-3 text-sm w-auto cursor-pointer"><option value="all">All</option><option value="unread">Unread</option></select>
          <button onClick={markAllRead} disabled={unreadCount === 0} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] text-sm text-slate-600 dark:text-[#A9AEA7] disabled:opacity-50"><CheckCheck className="w-4 h-4" />Mark all read</button>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm overflow-hidden">
        <div className="p-5 border-b border-black/[0.06] dark:border-[#303631] flex items-center gap-2"><Bell className="w-4 h-4 text-[#183B35] dark:text-[#8FB8A8]" /><h2 className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">Notification Center</h2><span className="ml-auto text-xs text-slate-500 dark:text-[#A9AEA7]">{unreadCount} unread</span></div>
        {loading ? <div className="p-8 flex items-center gap-3"><div className="w-5 h-5 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" /><span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading notifications...</span></div> : notifications.length === 0 ? <div className="p-8 text-center text-slate-400 dark:text-[#A9AEA7] text-sm">No notifications found.</div> : (
          <div className="divide-y divide-black/[0.06] dark:divide-[#303631]">{notifications.map((n) => <div key={n._id} className={`p-4 flex items-start gap-3 ${n.isRead ? "" : "bg-[#EFEAE1] dark:bg-[#222823]"}`}><Circle className={`w-2.5 h-2.5 mt-1.5 shrink-0 ${n.isRead ? "text-slate-300" : "fill-[#A67C52] text-[#A67C52]"}`} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-medium text-slate-900 dark:text-[#F2EFE8]">{n.title}</p><span className="text-[10px] uppercase tracking-[0.14em] text-slate-400 dark:text-[#A9AEA7]">{n.type?.replaceAll("_", " ")}</span></div><p className="text-sm text-slate-500 dark:text-[#A9AEA7] mt-1">{n.message}</p><p className="text-xs text-slate-400 dark:text-[#A9AEA7] mt-2">{new Date(n.createdAt).toLocaleString()}</p></div>{!n.isRead && <button onClick={() => markRead(n._id)} className="px-2.5 py-1 rounded-lg border border-[#A67C52]/45 text-xs text-[#183B35] dark:text-[#8FB8A8]">Mark read</button>}</div>)}</div>
        )}
      </div>
    </motion.div>
  );
};

export default Notifications;