import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../context/AppContext";
import { LifeBuoy, Plus, MessageSquare, Clock, CheckCircle, Loader2, Send } from "lucide-react";
import toast from "react-hot-toast";

const SupportTickets = () => {
  const { axios, getToken } = useAppContext();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    document.title = "Support — SmartStayX";
    const load = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const { data } = await axios.get("/api/support", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (data.success) {
          setTickets(data.tickets || []);
        }
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return toast.error("Subject and message are required");
    setSubmitting(true);
    try {
      const token = await getToken();
      const { data } = await axios.post(
        "/api/support",
        { subject, message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.success) {
        toast.success("Ticket created");
        setTickets((prev) => [data.ticket || data.supportTicket, ...prev]);
        setShowNew(false);
        setSubject("");
        setMessage("");
      } else {
        toast.error(data.message || "Failed to create ticket");
      }
    } catch {
      toast.error("Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 flex items-start justify-center">
        <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin mt-20" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white pt-24 pb-16">
      <div className="absolute inset-0 mesh-glow opacity-60" />
      <div className="relative mx-auto max-w-2xl px-4 md:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-playfair text-slate-900">Support Tickets</h1>
            <p className="text-sm text-slate-400 mt-1">Get help with your bookings and account</p>
          </div>
          <button
            onClick={() => setShowNew(!showNew)}
            className="gold-button flex items-center gap-2 px-4 py-2.5 text-xs uppercase tracking-[0.1em]"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>

        {showNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="luxury-card p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="luxury-input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase tracking-[0.12em] mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  className="luxury-input resize-none"
                  style={{ height: "auto", minHeight: "100px" }}
                />
              </div>
              <button
                type="submit"
                disabled={submitting || !subject.trim() || !message.trim()}
                className="gold-button flex items-center justify-center gap-2 w-full py-2.5 text-sm uppercase tracking-[0.18em] disabled:opacity-70"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? "Submitting..." : "Submit Ticket"}
              </button>
            </form>
          </motion.div>
        )}

        {tickets.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card p-12 text-center">
            <LifeBuoy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 text-sm">No support tickets yet</p>
            <p className="text-slate-400 text-xs mt-1">Create a ticket and we'll get back to you</p>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket, i) => (
              <motion.div
                key={ticket._id || i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="luxury-card p-4 flex items-start gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-[#f4f2ef] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-900 font-medium">{ticket.subject}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        ticket.status === "open"
                          ? "border-green-200 bg-green-50 text-green-700"
                          : ticket.status === "resolved"
                          ? "border-[#2563EB]/20 bg-[#2563EB]/10 text-[#2563EB]"
                          : ticket.status === "closed"
                          ? "border-black/[0.06] bg-[#f4f2ef] text-slate-500"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {ticket.status || "open"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{ticket.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupportTickets;
