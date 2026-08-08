import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAppContext } from "../../context/AppContext";
import { MessageSquare, Search, ChevronLeft, ChevronRight, Eye, EyeOff, Star, ThumbsUp, Meh, Frown, Angry } from "lucide-react";
import toast from "react-hot-toast";

const PER_PAGE = 12;

const satisfactionIcons = {
  very_satisfied: { icon: Star, color: "text-green-600" },
  satisfied: { icon: ThumbsUp, color: "text-blue-600" },
  neutral: { icon: Meh, color: "text-amber-600" },
  dissatisfied: { icon: Frown, color: "text-orange-600" },
  very_dissatisfied: { icon: Angry, color: "text-red-600" },
};

const Reviews = () => {
  const { axios, getToken } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState("all");

  const loadReviews = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/receptionist/reviews", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) setReviews(data.reviews);
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReviews(); }, []);
  useEffect(() => { setPage(0); }, [search, filter]);

  const handleToggle = async (id) => {
    try {
      const { data } = await axios.patch(`/api/receptionist/reviews/${id}/toggle`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        toast.success(data.message);
        await loadReviews();
      }
    } catch {
      toast.error("Failed to toggle visibility");
    }
  };

  const filtered = useMemo(() => {
    let items = reviews;
    if (filter === "visible") items = items.filter((r) => r.isVisible);
    else if (filter === "hidden") items = items.filter((r) => !r.isVisible);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter((r) =>
        (r.comment || "").toLowerCase().includes(q) ||
        (r.user?.name || r.user?.username || "").toLowerCase().includes(q) ||
        (r.hotel?.name || "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [reviews, search, filter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = useMemo(() => filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE), [filtered, page]);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`w-3 h-3 ${i < rating ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
    ));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Guest Reviews</h1>
          <p className="text-sm text-slate-500 mt-1">Moderate and manage guest reviews</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="luxury-select h-auto py-2 px-3 text-sm w-auto cursor-pointer">
            <option value="all">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="luxury-input w-48 h-auto py-2 pl-9 pr-3 text-xs" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-8 flex items-center gap-3">
          <div className="w-5 h-5 rounded-full border-2 border-[#2563EB]/25 border-t-[#2563EB] animate-spin" />
          <span className="text-sm text-slate-500">Loading reviews...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-slate-400 text-sm">No reviews found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginated.map((review) => {
            const sat = satisfactionIcons[review.satisfaction] || satisfactionIcons.neutral;
            const SatIcon = sat.icon;
            return (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-black/[0.06] bg-white shadow-sm p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-50 border border-black/[0.06] flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">
                        {(review.user?.name || review.user?.username || "G").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{review.user?.name || review.user?.username || "Guest"}</p>
                      <p className="text-[10px] text-slate-400">{review.hotel?.name} — Room {review.room?.roomNumber || ""}</p>
                    </div>
                  </div>
                  <button onClick={() => handleToggle(review._id)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      review.isVisible
                        ? "border-green-200 text-green-700 hover:bg-green-50"
                        : "border-red-200 text-red-600 hover:bg-red-50"
                    }`}>
                    {review.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                  <SatIcon className={`w-3.5 h-3.5 ${sat.color}`} />
                </div>

                {review.comment && (
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{review.comment}</p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-black/[0.06]">
                  <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  <span className={`px-1.5 py-0.5 rounded-full border ${
                    review.isVisible ? "border-green-200 text-green-700" : "border-red-200 text-red-600"
                  }`}>
                    {review.isVisible ? "Visible" : "Hidden"}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {filtered.length > PER_PAGE && (
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-xs text-slate-400">Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filtered.length)} of {filtered.length}</span>
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
      )}
    </motion.div>
  );
};

export default Reviews;
