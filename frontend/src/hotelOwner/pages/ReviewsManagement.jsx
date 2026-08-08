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
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Guest Reviews</h1>
          <p className="text-sm text-slate-400 mt-1">
            View and manage all guest reviews across your properties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search reviews..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-48 pl-9 pr-3 py-2 text-xs rounded-lg border border-black/[0.08] bg-white text-slate-600 placeholder:text-slate-400 outline-none focus:border-[#2563EB]/40 transition-colors"
            />
          </div>
          {hotels.length > 1 && (
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="luxury-select text-sm w-auto"
            >
              <option value="all">All Properties</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {!loading && filteredReviews.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Reviews", value: filteredReviews.length, color: "bg-blue-50 border-blue-100" },
            { label: "Average Rating", value: (filteredReviews.reduce((s, r) => s + r.rating, 0) / filteredReviews.length).toFixed(1), color: "bg-amber-50 border-amber-100" },
            { label: "5-Star Reviews", value: filteredReviews.filter((r) => r.rating === 5).length, color: "bg-emerald-50 border-emerald-100" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-2xl border ${stat.color} p-5`}>
              <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="luxury-card p-12 text-center">
          <div className="w-5 h-5 mx-auto rounded-full border-2 border-[#2563EB]/30 border-t-[#2563EB] animate-spin" />
          <p className="text-sm text-slate-400 mt-3">Loading reviews...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="luxury-card p-12 text-center">
          <Star className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p className="text-slate-500">No reviews yet</p>
          <p className="text-xs text-slate-400 mt-1">Guest reviews will appear here once guests leave feedback.</p>
        </div>
      ) : (
        <div className="luxury-card overflow-hidden">
          <div className="divide-y divide-black/[0.06]">
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
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB]/20 to-[#2563EB]/5 border border-black/[0.06] flex items-center justify-center">
                      <span className="text-xs font-medium text-slate-600">
                        {(review.user?.name || review.user?.username || "G").charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{review.user?.name || review.user?.username || "Guest"}</p>
                      <p className="text-[10px] text-slate-400">
                        {review.hotel?.name || "Unknown Hotel"} — {review.room?.roomType || "Room"}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 ml-auto">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? "text-[#2563EB] fill-[#2563EB]" : "text-slate-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-2 font-space">
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
                      ? "border-black/[0.08] text-slate-400 hover:text-amber-600 hover:border-amber-200"
                      : "border-red-200 text-red-500 hover:text-red-600"
                  } disabled:opacity-40`}
                  title={review.isVisible ? "Hide review" : "Show review"}
                >
                  {togglingId === review._id ? (
                    <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
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
            <div className="flex items-center justify-between px-5 py-4 border-t border-black/[0.06]">
              <span className="text-xs text-slate-400">
                Showing {page * PER_PAGE + 1}-{Math.min((page + 1) * PER_PAGE, filteredReviews.length)} of {filteredReviews.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-slate-700 hover:bg-black/[0.03] transition-all disabled:opacity-30"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: pages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      i === page
                        ? "bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20"
                        : "text-slate-400 hover:text-slate-700 hover:bg-black/[0.03] border border-transparent"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(Math.min(pages - 1, page + 1))}
                  disabled={page >= pages - 1}
                  className="p-1.5 rounded-lg border border-black/[0.08] text-slate-400 hover:text-slate-700 hover:bg-black/[0.03] transition-all disabled:opacity-30"
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
