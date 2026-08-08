// MyBookings — User's booking history, status tracking, and management actions
import { useEffect, useState, useCallback } from 'react'
import Title from '../components/Title'
import { placeholderImage } from '../assets/assets'
import { MapPin, Users, Star } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import ServicePortal from '../components/ServicePortal'
import BookingService from '../services/BookingService'
import { BOOKING_STATUS } from '../constants/bookingStatuses'

const SATISFACTION_OPTIONS = [
  { value: "very_satisfied", label: "Very Satisfied" },
  { value: "satisfied", label: "Satisfied" },
  { value: "neutral", label: "Neutral" },
  { value: "dissatisfied", label: "Dissatisfied" },
  { value: "very_dissatisfied", label: "Very Dissatisfied" },
]

const StarInput = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="p-0.5 transition-transform hover:scale-110"
      >
        <Star className={`w-6 h-6 ${star <= value ? "text-[#2563EB]" : "text-slate-300"}`} fill="currentColor" />
      </button>
    ))}
  </div>
)

// MyBookings — Displays user bookings with payment, cancellation, and service request actions
const MyBookings = () => {
    const { getToken, formatPrice, translate, axios, navigate } = useAppContext();
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [payingId, setPayingId] = useState(null)
    const [cancelingId, setCancelingId] = useState(null)
    const [serviceModal, setServiceModal] = useState({ open: false, roomId: null, hotelId: null })
    const [reviewModal, setReviewModal] = useState({ open: false, booking: null })
    const [reviewForm, setReviewForm] = useState({ rating: 0, satisfaction: "", comment: "" })
    const [reviewSubmitting, setReviewSubmitting] = useState(false)

    const [activeTab, setActiveTab] = useState("upcoming");

    // Derive latest confirmed booking for service eligibility
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const _latestConfirmed = confirmedBookings[confirmedBookings.length - 1];

    const getTab = (booking) => {
        if (booking.status === BOOKING_STATUS.CANCELLED) return "cancelled";
        if (booking.status === "expired") return "expired";
        if (booking.status === "checked_out") return "completed";
        const now = new Date();
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        if (booking.status === "checked_in") return "active";
        if (checkOut < now) return "completed";
        if (checkIn <= now && now <= checkOut) return "active";
        return "upcoming";
    };

    const TABS = [
        { key: "upcoming", label: "Upcoming" },
        { key: "active", label: "Active" },
        { key: "completed", label: "Completed" },
        { key: "cancelled", label: "Cancelled" },
        { key: "expired", label: "Expired" },
    ];

    const visibleBookings = bookings.filter((b) => getTab(b) === activeTab);

    // openServiceFor — Opens the service request modal for a booking room
    const _openServiceFor = (roomId, hotelId) => {
        setServiceModal({ open: true, roomId, hotelId });
    };

    // fetchBookings — Loads the current user's bookings from the API
    const fetchBookings = useCallback(async ({ showLoader = false } = {}) => {
        try {
            if (showLoader) setLoading(true);
            const token = await getToken();
            const data = await BookingService.fetchUserBookings(token);
            if (data.success) {
                setBookings(data.bookings || []);
            } else {
                toast.error(data.message || translate('fetchFailed'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || translate('fetchFailed'));
        } finally {
            if (showLoader) setLoading(false);
        }
    }, [getToken, translate]);

    useEffect(() => {
        fetchBookings({ showLoader: true });
    }, [fetchBookings]);

    // On mount, check for Stripe redirect — confirm checkout session if success param is present
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const payment = params.get('payment');
        const sessionId = params.get('session_id');

        if (payment !== 'success' || !sessionId) return;

        const confirmCheckout = async () => {
            try {
                const token = await getToken();
                const data = await BookingService.confirmCheckoutSession(sessionId, token);

                if (data.success && data.paid) {
                    toast.success(translate('paymentConfirmed'));
                } else if (data.success && !data.paid) {
                    toast(translate('paymentProcessing'));
                } else {
                    toast.error(data.message || translate('confirmFailed'));
                }
            } catch (error) {
                toast.error(error.response?.data?.message || translate('confirmFailed'));
            } finally {
                await fetchBookings();

                const url = new URL(window.location.href);
                url.searchParams.delete('payment');
                url.searchParams.delete('session_id');
                window.history.replaceState({}, '', url.toString());
            }
        };

        confirmCheckout();
    }, [fetchBookings, getToken, translate]);

    // handlePayNow — Initiates Stripe checkout session for an unpaid booking
    const handlePayNow = async (bookingId) => {
        if (!bookingId) return;
        setPayingId(bookingId);
        try {
            const token = await getToken();
            const data = await BookingService.createCheckoutSession(bookingId, token);

            if (!data.success || !data.url) {
                toast.error(data.message || translate('stripeError'));
                return;
            }

            window.location.assign(data.url);
        } catch (error) {
            toast.error(error.response?.data?.message || translate('stripeError'));
        } finally {
            setPayingId(null);
        }
    };

    // handleCancelBooking — Cancels an unpaid booking before check-in
    const handleCancelBooking = async (bookingId) => {
        if (!bookingId) return;
        setCancelingId(bookingId);
        try {
            const token = await getToken();
            const data = await BookingService.cancel(bookingId, token);

            if (data.success) {
                toast.success(data.message || translate('cancelledSuccess'));
                await fetchBookings();
            } else {
                toast.error(data.message || translate('cancelFailed'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || translate('cancelFailed'));
        } finally {
            setCancelingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-10 pt-32 pb-16">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 w-48 rounded bg-[#f4f2ef]" />
                        <div className="h-4 w-64 rounded bg-[#f4f2ef]" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 rounded-2xl bg-[#f4f2ef]" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-white pt-24 pb-16">
            <div className="absolute inset-0 mesh-glow opacity-40" />

            <div className="relative mx-auto max-w-6xl px-4 md:px-8 lg:px-10">
                <div className="flex items-start justify-between gap-4">
                    <Title title={translate('myBookings')} subtitle={translate('myBookingsSubtitle')} />
                </div>

                <div className="mt-6 flex flex-wrap gap-2 border-b border-black/[0.06] pb-3">
                    {TABS.map((tab) => {
                        const count = bookings.filter((b) => getTab(b) === tab.key).length;
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-4 py-2 text-sm rounded-full transition-colors ${
                                    active
                                        ? "bg-[#2563EB] text-white"
                                        : "bg-[#F1F5F9] text-slate-600 hover:bg-black/[0.06]"
                                }`}
                            >
                                {tab.label} {count > 0 && <span className="opacity-70">({count})</span>}
                            </button>
                        );
                    })}
                </div>

                {visibleBookings.length === 0 && !loading && (
                    <p className="text-center text-slate-400 py-16">{translate('noBookings')}</p>
                )}

                <div className="mt-6 space-y-4">
                    {visibleBookings.map((booking) => {
                        return (
                            <div key={booking._id} className="luxury-card overflow-hidden p-5 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-start gap-5">

                                    {/* Hotel image */}
                                    <div className="shrink-0">
                                        <img
                                            src={booking.room?.images?.[0] || placeholderImage}
                                            alt="hotel-img"
                                            className="h-32 w-44 rounded-2xl object-cover border border-black/[0.06]"
                                        />
                                    </div>

                                    {/* Hotel details */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <p className="font-playfair text-xl text-slate-900">
                                            {booking.hotel?.name || 'Hotel'}
                                            <span className="font-inter text-sm text-slate-500 ml-2">
                                                ({booking.roomNumber || booking.room?.roomNumber ? `Room ${booking.roomNumber || booking.room?.roomNumber}` : ''}{booking.room?.roomType ? `${booking.roomNumber || booking.room?.roomNumber ? ' — ' : ''}${booking.room.roomType}` : 'Room'})
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                            <MapPin className="w-4 h-4 opacity-60" />
                                            <span>{booking.hotel?.address || 'Address unavailable'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                            <Users className="w-4 h-4 opacity-60" />
                                            <span>{translate('guests')}: {booking.guests}</span>
                                        </div>
                                        <p className="text-sm text-slate-900 mt-1">
                                            {translate('total')}: <span className="text-[#2563EB] font-medium">{formatPrice(booking.totalPrice)}</span>
                                        </p>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex md:flex-col gap-4 md:gap-2 shrink-0">
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">{translate('checkIn')}</p>
                                            <p className="text-sm text-slate-900 mt-0.5">{new Date(booking.checkInDate).toDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">{translate('checkOut')}</p>
                                            <p className="text-sm text-slate-900 mt-0.5">{new Date(booking.checkOutDate).toDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-start gap-2 shrink-0">
                                        {booking.status === BOOKING_STATUS.RESERVATION && (
                                            <span className="text-[10px] text-amber-700 px-2 py-0.5 rounded-full border border-amber-200 bg-amber-50 font-medium">
                                                Reservation
                                            </span>
                                        )}
                                        {booking.status === BOOKING_STATUS.CANCELLED && (
                                            <p className="text-xs text-red-600 font-medium">{translate('bookingCancelled')}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2.5 w-2.5 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`} />
                                            <p className={`text-xs ${booking.isPaid ? "text-green-700" : "text-red-600"}`}>
                                                {booking.isPaid ? translate('paid') : translate('unpaid')}
                                            </p>
                                        </div>
                                        <p className="text-xs text-slate-400">{translate('method')}: {booking.paymentMethod || "Pay At Hotel"}</p>

                                        <div className="flex flex-col gap-1.5 mt-2">
                                            {booking.status === BOOKING_STATUS.RESERVATION && (
                                                <button
                                                    onClick={() => navigate(`/payment/${booking._id}`)}
                                                    className="gold-button text-xs px-4 py-2"
                                                >
                                                    Pay Now
                                                </button>
                                            )}
                                            {!booking.isPaid && booking.status !== BOOKING_STATUS.CANCELLED && booking.status !== BOOKING_STATUS.RESERVATION && (
                                                <button
                                                    onClick={() => handlePayNow(booking._id)}
                                                    disabled={payingId === booking._id}
                                                    className="ghost-button text-xs px-4 py-2"
                                                >
                                                    {payingId === booking._id ? translate('processing') : translate('payWithStripe')}
                                                </button>
                                            )}
                                            {!booking.isPaid && booking.status !== BOOKING_STATUS.CANCELLED && new Date(booking.checkInDate) > new Date() && (
                                                <button
                                                    onClick={() => handleCancelBooking(booking._id)}
                                                    disabled={cancelingId === booking._id}
                                                    className="text-xs px-4 py-2 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-60"
                                                >
                                                    {cancelingId === booking._id ? translate('cancelling') : translate('cancelBooking')}
                                                </button>
                                            )}
                                            {booking.status === BOOKING_STATUS.CONFIRMED && (
                                                <button
                                                    onClick={() => setServiceModal({ open: true, roomId: booking.room?._id, hotelId: booking.hotel?._id })}
                                                    className="text-xs px-4 py-2 rounded-full border border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10 transition"
                                                >
                                                    {translate('requestService')}
                                                </button>
                                            )}
                                            {booking.isPaid && booking.status === BOOKING_STATUS.CONFIRMED && (
                                                <button
                                                    onClick={() => {
                                                        setReviewForm({ rating: 0, satisfaction: "", comment: "" })
                                                        setReviewModal({ open: true, booking })
                                                    }}
                                                    className="text-xs px-4 py-2 rounded-full border border-[#2563EB]/30 text-[#2563EB] hover:bg-[#2563EB]/10 transition"
                                                >
                                                    Write a Review
                                                </button>
                                            )}
                                            {booking.isPaid && (
                                                <button
                                                    onClick={() => navigate(`/invoice/${booking._id}`)}
                                                    className="text-xs px-4 py-2 rounded-full border border-black/[0.1] text-slate-600 hover:text-slate-900 hover:border-black/20 transition"
                                                >
                                                    View Invoice
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {serviceModal.open && (
                <ServicePortal
                    roomId={serviceModal.roomId}
                    hotelId={serviceModal.hotelId}
                    onClose={() => setServiceModal({ open: false, roomId: null, hotelId: null })}
                />
            )}

            {reviewModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setReviewModal({ open: false, booking: null })}>
                    <div className="luxury-card w-full max-w-lg p-6 space-y-5" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-lg font-playfair text-slate-900">Write a Review</h3>
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            if (reviewForm.rating < 1) { toast.error("Please select a rating"); return }
                            if (!reviewForm.satisfaction) { toast.error("Please select your satisfaction level"); return }
                            setReviewSubmitting(true)
                            try {
                                const token = await getToken()
                                const { data } = await axios.post(
                                    `/api/reviews/room/${reviewModal.booking.room?._id}`,
                                    {
                                        rating: reviewForm.rating,
                                        satisfaction: reviewForm.satisfaction,
                                        comment: reviewForm.comment,
                                    },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                )
                                if (data.success) {
                                    toast.success("Review submitted successfully")
                                    setReviewModal({ open: false, booking: null })
                                } else {
                                    toast.error(data.message || "Failed to submit review")
                                }
                            } catch (error) {
                                toast.error(error.response?.data?.message || "Failed to submit review")
                            } finally {
                                setReviewSubmitting(false)
                            }
                        }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Rating</label>
                                <StarInput value={reviewForm.rating} onChange={(val) => setReviewForm((p) => ({ ...p, rating: val }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Satisfaction</label>
                                <select
                                    value={reviewForm.satisfaction}
                                    onChange={(e) => setReviewForm((p) => ({ ...p, satisfaction: e.target.value }))}
                                    className="luxury-select text-sm w-full"
                                >
                                    <option value="" className="bg-white">Select satisfaction level</option>
                                    {SATISFACTION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value} className="bg-white">{opt.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    Comment <span className="text-slate-400 font-normal">({500 - reviewForm.comment.length} characters left)</span>
                                </label>
                                <textarea
                                    value={reviewForm.comment}
                                    onChange={(e) => setReviewForm((p) => ({ ...p, comment: e.target.value }))}
                                    maxLength={500}
                                    rows={4}
                                    placeholder="Share your experience about this room..."
                                    className="luxury-input mt-1 resize-none"
                                />
                            </div>
                            <div className="flex items-center gap-3">
                                <button type="submit" disabled={reviewSubmitting} className="gold-button px-8 py-2.5 text-sm uppercase tracking-[0.18em] disabled:opacity-70">
                                    {reviewSubmitting ? "Submitting..." : "Submit Review"}
                                </button>
                                <button type="button" onClick={() => setReviewModal({ open: false, booking: null })} className="text-sm text-slate-500 hover:text-slate-900 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MyBookings
