// ReviewsManagement — Owner panel for moderating guest reviews and visibility
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Eye, EyeOff } from "lucide-react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const ReviewsManagement = () => {
  const { axios, getToken, user } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState("all");
  const [loading, setLoading] = useState(true);

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

  const toggleVisibility = async (reviewId, currentVisibility) => {
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
    }
  };

  useEffect(() => {
    if (user) loadOwnerReviews();
  }, [user]);

  const filteredReviews = selectedHotelId === "all"
    ? reviews
    : reviews.filter((r) => r.hotel?._id === selectedHotelId || r.hotel === selectedHotelId);

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
        <div className="grid gap-4">
          {filteredReviews.map((review) => (
            <motion.div
              key={review._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-white/[0.06] bg-white/[0.04] backdrop-blur-xl p-5"
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
                  className={`shrink-0 p-2 rounded-lg border transition-all ${
                    review.isVisible
                      ? "border-white/[0.06] text-white/30 hover:text-[#F59E0B] hover:border-[#F59E0B]/20"
                      : "border-[#EF4444]/20 text-[#EF4444]/60 hover:text-[#EF4444]"
                  }`}
                  title={review.isVisible ? "Hide review" : "Show review"}
                >
                  {review.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default ReviewsManagement;
