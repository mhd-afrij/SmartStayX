import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { CreditCard, Search, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import toast from "react-hot-toast";

const PER_PAGE = 15;

const Payments = () => {
  const { axios, getToken } = useAppContext();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/receptionist/reservations", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setReservations(data.reservations);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  useEffect(() => { setPage(0); }, [search, filter]);

  const handleMarkPaid = async (id) => {
    setUpdatingId(id);
    try {
      const { data } = await axios.post(`/api/receptionist/reservations/${id}/payment`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success("Payment marked as received");
        await load();
      } else {
        toast.error(data.message || "Failed");
      }
    } catch {
      toast.error("Failed to mark payment");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = useMemo(() => {
    let items = reservations;
    if (filter === "paid") items = items.filter((r) => r.isPaid);
    else if (filter === "unpaid") items = items.filter((r) => !r.isPaid);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) =>
        (r.guestName || "").toLowerCase().includes(q) ||
        (r.hotel || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [reservations, search, filter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(() => filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [filtered, page]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Payments</h1>
          <p className="text-sm text-slate-500 mt-1">Track and manage guest payments</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="luxury-select h-auto py-2 px-3 text-sm w-auto cursor-pointer">
            <option value="all">All</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="luxury-input w-48 h-auto py-2 pl-9 pr-3 text-xs" />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/[0.06] bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b border-black/[0.06]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-900">Payment Records</h3>
              <p className="text-xs text-slate-500">Guest payments and collection status</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2 border-[#2563EB]/25 border-t-[#2563EB] animate-spin" />
            <span className="text-sm text-slate-500">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-sm">No payments found.</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#f4f2ef] border-b border-black/[0.06]">
                    {["Guest", "Hotel", "Amount", "Method", "Status", "Actions"].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((item) => (
                    <tr key={item._id} className="border-b border-black/[0.06] hover:bg-black/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-50 border border-black/[0.06] flex items-center justify-center">
                            <span className="text-[10px] font-medium text-slate-600">{item.guestName?.charAt(0)?.toUpperCase()}</span>
                          </div>
                          <span className="text-slate-700">{item.guestName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.hotel}</td>
                      <td className="py-3 px-4 text-slate-900 font-space">${item.totalPrice?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-500">{item.paymentMethod || "—"}</td>
                      <td className="py-3 px-4">
                        {item.isPaid ? (
                          <span className="flex items-center gap-1 text-xs text-green-700"><CheckCircle className="w-3 h-3" /> Paid</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-amber-600"><XCircle className="w-3 h-3" /> Pending</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {!item.isPaid && (
                          <button
                            onClick={() => handleMarkPaid(item._id)}
                            disabled={updatingId === item._id}
                            className="px-2 py-1 text-[10px] rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-all disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-4 py-4 border-t border-black/[0.06]">
              <span className="text-xs text-slate-400">
                Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border border-black/[0.06] text-slate-400 hover:text-slate-700 hover:bg-black/[0.04] transition-all disabled:opacity-30">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${i === page ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "text-slate-400 hover:text-slate-700 hover:bg-black/[0.04] border border-transparent"}`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(Math.min(pages - 1, page + 1))} disabled={page >= pages - 1}
                  className="p-1.5 rounded-lg border border-black/[0.06] text-slate-400 hover:text-slate-700 hover:bg-black/[0.04] transition-all disabled:opacity-30">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Payments;
