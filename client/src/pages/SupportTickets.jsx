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
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
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
            <h1 className="text-2xl font-playfair text-white">Support Tickets</h1>
            <p className="text-sm text-white/40 mt-1">Get help with your bookings and account</p>
          </div>
          <button
            onClick={() => setShowNew(!showNew)}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-xl bg-gradient-to-r from-[#D4A85F] to-[#F5D08A] text-[#0B1220] hover:shadow-lg hover:shadow-[#D4A85F]/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Ticket
          </button>
        </div>

        {showNew && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="luxury-card p-6 mb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-[0.12em] mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief description of your issue"
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 uppercase tracking-[0.12em] mb-1.5">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Describe your issue in detail..."
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors resize-none"
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
            <LifeBuoy className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-white/50 text-sm">No support tickets yet</p>
            <p className="text-white/30 text-xs mt-1">Create a ticket and we'll get back to you</p>
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
                <div className="w-9 h-9 rounded-xl bg-white/[0.04] flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-white/30" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white font-medium">{ticket.subject}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        ticket.status === "open"
                          ? "border-[#22C55E]/20 bg-[#22C55E]/10 text-[#22C55E]"
                          : ticket.status === "resolved"
                          ? "border-[#D4A85F]/20 bg-[#D4A85F]/10 text-[#D4A85F]"
                          : ticket.status === "closed"
                          ? "border-white/[0.06] bg-white/[0.04] text-white/40"
                          : "border-[#F59E0B]/20 bg-[#F59E0B]/10 text-[#F59E0B]"
                      }`}
                    >
                      {ticket.status || "open"}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-1 line-clamp-2">{ticket.message}</p>
                  <p className="text-[10px] text-white/20 mt-1.5">
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
