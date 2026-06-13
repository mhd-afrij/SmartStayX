// ReviewSection — Guest reviews section with rating, filter, and submission
import { useState, useEffect, useCallback } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const SATISFACTION_OPTIONS = [
  { value: "very_satisfied", label: "Very Satisfied" },
  { value: "satisfied", label: "Satisfied" },
  { value: "neutral", label: "Neutral" },
  { value: "dissatisfied", label: "Dissatisfied" },
  { value: "very_dissatisfied", label: "Very Dissatisfied" },
];

const SATISFACTION_STYLES = {
  very_satisfied: "bg-green-900/30 text-green-400 border-green-700/30",
  satisfied: "bg-emerald-900/30 text-emerald-400 border-emerald-700/30",
  neutral: "bg-yellow-900/30 text-yellow-400 border-yellow-700/30",
  dissatisfied: "bg-orange-900/30 text-orange-400 border-orange-700/30",
  very_dissatisfied: "bg-red-900/30 text-red-400 border-red-700/30",
};

const StarInput = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="p-0.5 transition-transform hover:scale-110"
      >
        <svg
          className={`w-6 h-6 ${star <= value ? "text-[#F5D08A]" : "text-white/20"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      </button>
    ))}
  </div>
);

export default function ReviewSection({ roomId }) {
  const { axios, user, getToken } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [satisfactionBreakdown, setSatisfactionBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ rating: 0, satisfaction: "", comment: "" });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/reviews/room/${roomId}`);
      if (data.success) {
        setReviews(data.reviews);
        setAverageRating(data.averageRating);
        setTotalReviews(data.totalReviews);
        setSatisfactionBreakdown(data.satisfactionBreakdown);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [roomId, axios]);

  useEffect(() => {
    if (roomId) fetchReviews();
  }, [roomId, fetchReviews]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to submit a review");
      return;
    }
    if (form.rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    if (!form.satisfaction) {
      toast.error("Please select your satisfaction level");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await axios.post(
        `/api/reviews/room/${roomId}`,
        {
          rating: form.rating,
          satisfaction: form.satisfaction,
          comment: form.comment,
        },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );
      if (data.success) {
        toast.success("Review submitted successfully");
        setForm({ rating: 0, satisfaction: "", comment: "" });
        fetchReviews();
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl md:text-3xl font-playfair text-white">Reviews</h2>
        {!loading && totalReviews > 0 && (
          <span className="text-sm text-white/50">({totalReviews})</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="luxury-card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-white/5" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded bg-white/5" />
                  <div className="h-3 w-16 rounded bg-white/5" />
                </div>
              </div>
              <div className="h-3 w-3/4 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="luxury-card p-8 text-center">
          <p className="text-white/50">No reviews yet. Be the first to share your experience!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {satisfactionBreakdown && totalReviews > 0 && (
            <div className="luxury-card-soft p-4 flex flex-wrap gap-4 text-xs">
              <span className="text-white/60">
                Average: <span className="text-[#F5D08A] font-semibold">{averageRating.toFixed(1)}</span> / 5
              </span>
              {SATISFACTION_OPTIONS.map((opt) => (
                <span key={opt.value} className="text-white/40">
                  {opt.label}: <span className="text-white/70">{satisfactionBreakdown[opt.value] || 0}</span>
                </span>
              ))}
            </div>
          )}
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
            {reviews.map((review) => (
              <div key={review._id} className="luxury-card p-5">
                <div className="flex items-start gap-3">
                  <img
                    src={review.user?.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.guestName)}&background=0d1728&color=D4A85F&size=40`}
                    alt={review.guestName}
                    className="h-10 w-10 rounded-full object-cover border border-white/10"
                    onError={(e) => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.guestName)}&background=0d1728&color=D4A85F&size=40`; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{review.guestName}</span>
                      <span className="text-[10px] text-white/40">{formatDate(review.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <svg
                            key={s}
                            className={`w-3 h-3 ${s <= review.rating ? "text-[#F5D08A]" : "text-white/20"}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      {review.satisfaction && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${SATISFACTION_STYLES[review.satisfaction] || "bg-white/5 text-white/50"}`}>
                          {SATISFACTION_OPTIONS.find((o) => o.value === review.satisfaction)?.label || review.satisfaction}
                        </span>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-white/70 mt-2 leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {user && (
        <div className="luxury-card p-6">
          <h3 className="text-lg font-playfair text-white mb-4">Write a Review</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Rating</label>
              <StarInput value={form.rating} onChange={(val) => setForm((p) => ({ ...p, rating: val }))} />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Satisfaction</label>
              <select
                value={form.satisfaction}
                onChange={(e) => setForm((p) => ({ ...p, satisfaction: e.target.value }))}
                className="luxury-select text-sm w-full"
              >
                <option value="" className="bg-[#0d1728]">Select satisfaction level</option>
                {SATISFACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[#0d1728]">{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Comment <span className="text-white/30 font-normal">({500 - form.comment.length} characters left)</span>
              </label>
              <textarea
                value={form.comment}
                onChange={(e) => setForm((p) => ({ ...p, comment: e.target.value }))}
                maxLength={500}
                rows={4}
                placeholder="Share your experience about this room..."
                className="luxury-input mt-1 resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="gold-button px-8 py-2.5 text-sm uppercase tracking-[0.18em] disabled:opacity-70"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      )}
    </section>
  );
}
