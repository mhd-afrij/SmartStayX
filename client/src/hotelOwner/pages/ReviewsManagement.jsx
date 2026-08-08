// ReviewsManagement — Owner panel for moderating guest reviews and visibility
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Star, Eye, EyeOff, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const PER_PAGE = 5;

const ReviewsManagement = () => {
  const { axios, getToken, user } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  // loadOwnerReviews — Fetches owner's reviews grouped by hotel
  const loadOwnerReviews = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/reviews/owner", {
        headers: { Authorization: `Bearer ${await getToken()}` },
      });
      if (data.success) {
        setReviews(data.reviews || []);
        setHotels(data.hotels || []);
      } else {
        toast.error(data.message || "Failed to load reviews");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  // toggleVisibility — Toggles a review's visible/hidden status
  const toggleVisibility = async (reviewId, currentVisibility) => {
    setTogglingId(reviewId);
    try {
      const { data } = await axios.patch(
        `/api/reviews/${reviewId}/visibility`,
        { isVisible: !currentVisibility },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId ? { ...r, isVisible: !currentVisibility } : r
          )
        );
        toast.success(`Review ${currentVisibility ? "hidden" : "shown"} successfully`);
      } else {
        toast.error(data.message || "Failed to update review");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update review");
    } finally {
      setTogglingId(null);
    }
  };

  useEffect(() => {
    if (user) loadOwnerReviews();
  }, [user]);

  const filteredReviews = useMemo(() => {
    let list = selectedHotelId === "all" ? reviews : reviews.filter((r) => r.hotel?._id === selectedHotelId || r.hotel === selectedHotelId);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => (r.user?.name || r.user?.username || "").toLowerCase().includes(q) || (r.comment || "").toLowerCase().includes(q));
    }
    return list;
  }, [reviews, selectedHotelId, search]);

  const pages = Math.max(1, Math.ceil(filteredReviews.length / PER_PAGE));
  const paginatedReviews = filteredReviews.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 pb-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Guest Reviews</h1>
          <p className="text-sm text-white/40 mt-1">
            View and manage all guest reviews across your properties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-48 pl-9 pr-3 py-2 text-xs rounded-lg border border-white/[0.06] bg-white/[0.04] text-white/70 placeholder:text-white/30 outline-none focus:border-[#D4A85F]/30 transition-colors"
            />
          </div>
          {hotels.length > 1 && (
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-white/[0.06] bg-white/[0.04] text-white/70 outline-none focus:border-[#D4A85F]/30 transition-colors"
            >
              <option value="all" className="bg-[#0B1220]">All Properties</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id} className="bg-[#0B1220]">{h.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!loading && filteredReviews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Reviews", value: filteredReviews.length, color: "from-blue-500/20 to-blue-600/10 border-blue-500/30" },
            { label: "Average Rating", value: (filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length).toFixed(1), color: "from-amber-500/20 to-amber-600/10 border-amber-500/30" },
            { label: "5-Star Reviews", value: filteredReviews.filter((r) => r.rating === 5).length, color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border bg-gradient-to-br ${stat.color} bg-white/[0.04] backdrop-blur-xl p-5`}>
              <p className="text-xs uppercase tracking-wider text-white/50">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-12 text-center">
          <div className="w-5 h-5 mx-auto rounded-full border-2 border-[#D4A85F]/30 border-t-[#D4A85F] animate-spin" />
          <p className="text-sm text-white/40 mt-3">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-12 text-center">
          <Star className="w-10 h-10 mx-auto mb-3 text-white/20" />
          <p className="text-white/50">No reviews yet</p>
          <p className="text-xs text-white/30 mt-1">Guest reviews will appear here once guests leave feedback.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {paginatedReviews.map((review) => (
              <motion.div
                key={review._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5"
              >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#D4A85F]/20 to-[#D4A85F]/5 border border-white/[0.06] flex items-center justify-center">
                      <span className="text-xs font-medium text-white/60">
                        {(review.user?.name || review.user?.username || "G").charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{review.user?.name || review.user?.username || "Guest"}</p>
                      <p className="text-[10px] text-white/30">
                        {review.hotel?.name || "Unknown Hotel"} — {review.room?.roomType || "Room"}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? "text-[#F5D08A] fill-[#F5D08A]" : "text-white/20"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-white/60 leading-relaxed">{review.comment}</p>
                  )}
                  <p className="text-[10px] text-white/30 mt-2 font-space">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => toggleVisibility(review._id, review.isVisible)}
                  disabled={togglingId === review._id}
                  className={`shrink-0 p-2 rounded-lg border transition-all ${
                    review.isVisible
                      ? "border-white/[0.06] text-white/30 hover:text-[#F59E0B] hover:border-[#F59E0B]/20"
                      : "border-[#EF4444]/20 text-[#EF4444]/60 hover:text-[#EF4444]"
                  } disabled:opacity-40`}
                  title={review.isVisible ? "Hide review" : "Show review"}
                >
                  {togglingId === review._id ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                  ) : review.isVisible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              </div>
            </motion.div>
          ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
              <span className="text-xs text-white/30">
                Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filteredReviews.length)} of {filteredReviews.length}
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
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ReviewsManagement;
