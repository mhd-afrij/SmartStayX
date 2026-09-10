import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import Badge from "../../components/ui/Badge";
import {
  Users,
  Search,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Wallet,
  BedDouble,
  History,
  ConciergeBell,
} from "lucide-react";
import toast from "react-hot-toast";

const PER_PAGE = 12;

const Guests = () => {
  const { axios, getToken, formatPrice } = useAppContext();
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detail, setDetail] = useState(null);

  const loadGuests = async (q = search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (q && q.trim()) params.set("search", q.trim());
      const { data } = await axios.get(`/api/receptionist/guests?${params}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setGuests(data.guests);
      } else {
        toast.error(data.message || "Failed to load guests");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load guests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadGuests(); }, []);
  useEffect(() => { setPage(0); }, [search]);

  const openGuest = async (guest) => {
    setSelected(guest);
    setDetailLoading(true);
    setDetail(null);
    try {
      const id = guest.guestId || guest.email || guest.name;
      const { data } = await axios.get(`/api/receptionist/guests/${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setDetail(data);
      else toast.error(data.message || "Failed to load guest profile");
    } catch (error) {
      toast.error("Failed to load guest profile");
    } finally {
      setDetailLoading(false);
    }
  };

  const filtered = guests;
  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#F2EFE8] tracking-tight">Guest Profiles</h1>
          <p className="text-sm text-slate-500 dark:text-[#A9AEA7] mt-1">Search by name, NIC/Passport or phone to view previous visits and room history.</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); loadGuests(); }}
          className="relative w-full sm:w-72"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-[#A9AEA7]" />
          <input
            type="text"
            placeholder="Name, NIC/Passport, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="luxury-input w-full h-auto py-2 pl-9 pr-3 text-sm"
          />
        </form>
      </div>

      <div className="rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" />
            <span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading guests...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 dark:text-[#A9AEA7] text-sm">
            No guests found. Try a different search term.
          </div>
        ) : (
          <>
<div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#EFEEE8] dark:bg-[#222823] border-b border-black/[0.06] dark:border-[#303631]">
                    {["Guest", "Contact", "Stays", "Total Spent", "Last Stay", "Upcoming", "Action"].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((g) => (
                    <tr key={g.guestId || g.email || g.name} className="border-b border-black/[0.06] dark:border-[#303631] hover:bg-black/[0.02] dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[#EFEEE8] dark:bg-[#222823] border border-black/[0.06] dark:border-[#303631] flex items-center justify-center">
                            <span className="text-[10px] font-medium text-slate-600 dark:text-[#A9AEA7]">{g.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <span className="text-slate-700 dark:text-[#E8EDE6] font-medium">{g.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-0.5 text-slate-500 dark:text-[#A9AEA7]">
                          <span className="flex items-center gap-1 text-[11px]"><Mail className="w-3 h-3" />{g.email || "—"}</span>
                          <span className="flex items-center gap-1 text-[11px]"><Phone className="w-3 h-3" />{g.phone || "—"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center"><Badge tone="neutral">{g.stays}</Badge></td>
                      <td className="py-3 px-4 text-slate-900 dark:text-[#F2EFE8] font-space font-medium">{formatPrice(g.totalSpent)}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-[#A9AEA7] text-xs">
                        {g.lastStay ? new Date(g.lastStay).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 px-4 text-slate-500 dark:text-[#A9AEA7] text-xs">
                        {g.upcomingStay ? new Date(g.upcomingStay).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => openGuest(g)}
                          className="flex items-center gap-1 px-2.5 py-1 text-[10px] rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
                        >
                          <Eye className="w-3 h-3" /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-4 border-t border-black/[0.06] dark:border-[#303631]">
              <span className="text-xs text-slate-400 dark:text-[#A9AEA7]">Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border border-black/[0.06] dark:border-[#303631] text-slate-400 dark:text-[#A9AEA7] hover:text-slate-700 dark:hover:text-[#F2EFE8] hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === page ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-400 dark:text-[#A9AEA7] hover:text-slate-700 dark:hover:text-[#F2EFE8] hover:bg-black/[0.04] dark:hover:bg-white/5 border border-transparent"}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
                  className="p-1.5 rounded-lg border border-black/[0.06] dark:border-[#303631] text-slate-400 dark:text-[#A9AEA7] hover:text-slate-700 dark:hover:text-[#F2EFE8] hover:bg-black/[0.04] dark:hover:bg-white/5 transition-all disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
<AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ y: 16, scale: 0.97, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: 16, scale: 0.97, opacity: 0 }}
              className="w-full max-w-3xl max-h-[85vh] rounded-2xl border border-black/[0.06] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-2xl overflow-y-auto"
            >
              <div className="flex items-center justify-between p-5 border-b border-black/[0.06] dark:border-[#303631]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#183B35] dark:bg-[#222823] flex items-center justify-center text-[#F2EFE8] font-bold">
                    {selected.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-[#F2EFE8]">{selected.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-[#A9AEA7]">{selected.email || "No email on file"}{selected.phone ? ` · ${selected.phone}` : ""}</p>
                  </div>
                </div>
                <button onClick={() => setSelected(null)} className="p-2 rounded-lg border border-black/[0.08] dark:border-[#303631] text-slate-500 dark:text-[#A9AEA7] hover:text-slate-800 dark:hover:text-[#F2EFE8]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {detailLoading ? (
                <div className="p-8 flex items-center justify-center gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-[#2A4A43]/30 border-t-[#183B35] animate-spin" />
                  <span className="text-sm text-slate-500 dark:text-[#A9AEA7]">Loading guest history...</span>
                </div>
              ) : detail ? (
                <div className="p-5 space-y-5">
                  {/* Room history */}
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <History className="w-4 h-4 text-[#A67C52]" />
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-[#F2EFE8]">Previous Visits / Room History</h4>
                    </div>
                    {detail.bookings?.length === 0 ? (
                      <p className="text-sm text-slate-400 dark:text-[#A9AEA7]">No stays recorded.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-[#EFEEE8] dark:bg-[#222823]">
                              {["Dates", "Room", "Guests", "Total", "Status"].map((h) => (
                                <th key={h} className="py-2 px-3 text-left font-medium text-slate-500 dark:text-[#A9AEA7] uppercase tracking-wider">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {detail.bookings.map((b) => (
                              <tr key={b._id} className="border-b border-black/[0.06] dark:border-[#303631]">
                                <td className="py-2 px-3 text-slate-700 dark:text-[#E8EDE6]">
                                  {new Date(b.checkInDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(b.checkOutDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </td>
                                <td className="py-2 px-3 text-slate-500 dark:text-[#A9AEA7]">{b.roomNumber || b.room?.roomNumber || "—"} {b.room?.roomType ? `· ${b.room.roomType}` : ""}</td>
                                <td className="py-2 px-3 text-center text-slate-500 dark:text-[#A9AEA7]">{b.guests}</td>
                                <td className="py-2 px-3 text-slate-900 dark:text-[#F2EFE8] font-space">{formatPrice(b.totalPrice)}</td>
                                <td className="py-2 px-3"><Badge tone={b.status === "checked_out" ? "completed" : b.status === "cancelled" ? "cancelled" : b.status === "checked_in" ? "checkedIn" : b.status === "confirmed" ? "confirmed" : "pending"}>{b.status}</Badge></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>                </div>
              ) : (
                <div className="p-8 text-center text-sm text-slate-400 dark:text-[#A9AEA7]">
                  Select a guest to view history.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Guests;
