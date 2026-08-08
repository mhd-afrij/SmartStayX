import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { Bell, CheckCheck, Loader2, Calendar, Info, AlertCircle, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

const typeIcons = {
  booking: Calendar,
  promotion: Sparkles,
  alert: AlertCircle,
  info: Info,
};

const Notifications = () => {
  const { axios, getToken } = useAppContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Notifications — SmartStayX";
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const { data } = await axios.get("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const token = await getToken();
      await axios.put("/api/notifications/read-all", null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All marked as read");
    } catch {
      toast.error("Failed to mark as read");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#07111f] pt-32 flex items-start justify-center">
        <Loader2 className="w-6 h-6 text-[#D4A85F] animate-spin mt-20" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#07111f] pt-24 pb-16">
      <div className="absolute inset-0 mesh-glow opacity-40" />
      <div className="relative mx-auto max-w-2xl px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-playfair text-white">Notifications</h1>
            <p className="text-sm text-white/40 mt-1">Stay updated with your bookings and offers</p>
          </div>
          {notifications.some((n) => !n.read) && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.15em] rounded-xl border border-white/[0.06] text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark All Read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-sm">No notifications yet</p>
            <p className="text-white/30 text-xs mt-1">You'll see booking updates and offers here</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif, i) => {
              const Icon = typeIcons[notif.type] || Bell;
              return (
                <motion.div
                  key={notif._id || i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`luxury-card p-4 flex items-start gap-4 ${!notif.read ? "border-l-2 border-l-[#D4A85F]" : ""}`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${!notif.read ? "bg-[#D4A85F]/10" : "bg-white/[0.04]"}`}>
                    <Icon className={`w-4 h-4 ${!notif.read ? "text-[#D4A85F]" : "text-white/30"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notif.read ? "text-white font-medium" : "text-white/60"}`}>{notif.message || notif.title}</p>
                    {notif.description && <p className="text-xs text-white/40 mt-0.5">{notif.description}</p>}
                    <p className="text-[10px] text-white/20 mt-1.5">
                      {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                  {!notif.read && <span className="w-2 h-2 rounded-full bg-[#D4A85F] shrink-0 mt-2" />}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
