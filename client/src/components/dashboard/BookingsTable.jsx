import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const statusConfig = {
  upcoming: { label: "Upcoming", color: "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20" },
  confirmed: { label: "Confirmed", color: "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20" },
  "checked-in": { label: "Checked-in", color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" },
  completed: { label: "Completed", color: "bg-[#D4A85F]/10 text-[#D4A85F] border-[#D4A85F]/20" },
  cancelled: { label: "Cancelled", color: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20" },
};

const paymentConfig = {
  paid: { label: "Paid", color: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20" },
  pending: { label: "Pending", color: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20" },
};

const BookingsTable = ({ bookings = [], onDelete, deletingId, formatCurrency }) => {
  // Search, sorting, and pagination state.
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(0);
  const perPage = 5;

  const filtered = useMemo(() => {
    // Apply search and sort before paginating the bookings.
    let list = [...bookings];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          (b.user?.username || "").toLowerCase().includes(q) ||
          (b.room?.roomType || "").toLowerCase().includes(q) ||
          (b.status || "").toLowerCase().includes(q)
      );
    }
    if (sortKey) {
      list.sort((a, b) => {
        let av = a[sortKey];
        let bv = b[sortKey];
        if (sortKey === "checkInDate" || sortKey === "checkOutDate") {
          av = new Date(av).getTime();
          bv = new Date(bv).getTime();
        }
        if (typeof av === "string") av = av.toLowerCase();
        if (typeof bv === "string") bv = bv.toLowerCase();
        if (av < bv) return sortDir === "asc" ? -1 : 1;
        if (av > bv) return sortDir === "asc" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [bookings, search, sortKey, sortDir]);

  const pages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="relative rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden"
    >
      {/* Table header and search */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-white">Recent Bookings</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="w-56 pl-9 pr-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
            />
          </div>
        </div>

        {/* Scrollable booking table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Guest", "Room", "Check-in", "Check-out", "Total", "Status", "Payment", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className={`py-3 px-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider ${
                        h ? "cursor-pointer hover:text-white/60" : ""
                      }`}
                      onClick={() => h && toggleSort(h.toLowerCase().replace("-", ""))}
                    >
                      <div className="flex items-center gap-1">
                        {h}
                        {h && sortKey === h.toLowerCase().replace("-", "") && (
                          <ArrowUpDown className="w-3 h-3" />
                        )}
                      </div>
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {paginated.map((item) => {
                const st = statusConfig[item.status] || statusConfig.upcoming;
                const pm = item.isPaid ? paymentConfig.paid : paymentConfig.pending;
                return (
                  <tr
                    key={item._id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-white/[0.06] flex items-center justify-center">
                          <span className="text-[10px] font-medium text-white/60">
                            {(item.user?.username || "G").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-white/80">{item.user?.username || "Guest"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white/60">{item.room?.roomType || "Room"}</td>
                    <td className="py-3 px-3 text-white/60 font-space text-xs">
                      {new Date(item.checkInDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 text-white/60 font-space text-xs">
                      {new Date(item.checkOutDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-3 px-3 text-white font-space text-sm">
                      {formatCurrency(item.totalPrice)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${st.color}`}
                      >
                        {st.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full border ${pm.color}`}
                      >
                        {pm.label}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <button
                        onClick={() => onDelete(item._id)}
                        disabled={deletingId === item._id}
                        className="p-1.5 rounded-lg border border-white/[0.06] text-white/30 hover:text-[#EF4444] hover:border-[#EF4444]/20 hover:bg-[#EF4444]/10 transition-all disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-white/30 text-sm">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/[0.06]">
          <span className="text-xs text-white/30">
            Showing {page * perPage + 1}-{Math.min((page + 1) * perPage, filtered.length)} of{" "}
            {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                  i === page
                    ? "bg-[#D4A85F]/10 text-[#D4A85F] border border-[#D4A85F]/20"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.06] border border-transparent"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(pages - 1, page + 1))}
              disabled={page >= pages - 1}
              className="p-1.5 rounded-lg border border-white/[0.06] text-white/40 hover:text-white/70 hover:bg-white/[0.06] transition-all disabled:opacity-30"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BookingsTable;
