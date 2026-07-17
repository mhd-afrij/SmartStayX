// MyBookings — User's booking history, status tracking, and management actions
import { useEffect, useState } from 'react'
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
        <Star className={`w-6 h-6 ${star <= value ? "text-[#F5D08A]" : "text-white/20"}`} fill="currentColor" />
      </button>
    ))}
  </div>
)

// MyBookings — Displays user bookings with payment, cancellation, refund, and service request actions
const MyBookings = () => {
    const { getToken, formatPrice, translate, user, axios, navigate } = useAppContext();
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [payingId, setPayingId] = useState(null)
    const [cancelingId, setCancelingId] = useState(null)
    const [refundingId, setRefundingId] = useState(null)
    const [serviceModal, setServiceModal] = useState({ open: false, roomId: null, hotelId: null })
    const [reviewModal, setReviewModal] = useState({ open: false, booking: null })
    const [reviewForm, setReviewForm] = useState({ rating: 0, satisfaction: "", comment: "" })
    const [reviewSubmitting, setReviewSubmitting] = useState(false)

    // Derive latest confirmed booking for service eligibility
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const latestConfirmed = confirmedBookings[confirmedBookings.length - 1];

    // openServiceFor — Opens the service request modal for a booking room
    const openServiceFor = (roomId, hotelId) => {
        setServiceModal({ open: true, roomId, hotelId });
    };

    // fetchBookings — Loads the current user's bookings from the API
    const fetchBookings = async ({ showLoader = false } = {}) => {
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
    };

    useEffect(() => {
        fetchBookings({ showLoader: true });
    }, []);

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
    }, []);

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

    // handleRefundRequest — Submits a refund request for a paid booking
    const handleRefundRequest = async (bookingId) => {
        if (!bookingId) return;
        setRefundingId(bookingId);
        try {
            const token = await getToken();
            const { data } = await axios.post(
                '/api/bookings/refund-request',
                { bookingId },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (data.success) {
                toast.success(data.message || "Refund request submitted");
                await fetchBookings();
            } else {
                toast.error(data.message || "Failed to request refund");
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to request refund");
        } finally {
            setRefundingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#07111f]">
                <div className="mx-auto max-w-6xl px-4 md:px-8 lg:px-10 pt-32 pb-16">
                    <div className="animate-pulse space-y-6">
                        <div className="h-6 w-48 rounded bg-white/5" />
                        <div className="h-4 w-64 rounded bg-white/5" />
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 rounded-2xl bg-white/5" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#07111f] pt-24 pb-16">
            <div className="absolute inset-0 mesh-glow opacity-40" />

            <div className="relative mx-auto max-w-6xl px-4 md:px-8 lg:px-10">
                <div className="flex items-start justify-between gap-4">
                    <Title title={translate('myBookings')} subtitle={translate('myBookingsSubtitle')} />
                </div>

                {bookings.length === 0 && !loading && (
                    <p className="text-center text-white/40 py-16">{translate('noBookings')}</p>
                )}

                <div className="mt-8 space-y-4">
                    {bookings.map((booking) => {
                        return (
                            <div key={booking._id} className="luxury-card overflow-hidden p-5 md:p-6">
                                <div className="flex flex-col md:flex-row md:items-start gap-5">

                                    {/* Hotel image */}
                                    <div className="shrink-0">
                                        <img
                                            src={booking.room?.images?.[0] || placeholderImage}
                                            alt="hotel-img"
                                            className="h-32 w-44 rounded-2xl object-cover border border-white/10"
                                        />
                                    </div>

                                    {/* Hotel details */}
                                    <div className="flex-1 min-w-0 space-y-2">
                                        <p className="font-playfair text-xl text-white">
                                            {booking.hotel?.name || 'Hotel'}
                                            <span className="font-inter text-sm text-white/50 ml-2">
                                                ({booking.roomNumber || booking.room?.roomNumber ? `Room ${booking.roomNumber || booking.room?.roomNumber}` : ''}{booking.room?.roomType ? `${booking.roomNumber || booking.room?.roomNumber ? ' — ' : ''}${booking.room.roomType}` : 'Room'})
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                                            <MapPin className="w-4 h-4 opacity-60" />
                                            <span>{booking.hotel?.address || 'Address unavailable'}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                                            <Users className="w-4 h-4 opacity-60" />
                                            <span>{translate('guests')}: {booking.guests}</span>
                                        </div>
                                        <p className="text-sm text-white mt-1">
                                            {translate('total')}: <span className="text-[#F5D08A] font-medium">{formatPrice(booking.totalPrice)}</span>
                                        </p>
                                    </div>

                                    {/* Dates */}
                                    <div className="flex md:flex-col gap-4 md:gap-2 shrink-0">
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wider">{translate('checkIn')}</p>
                                            <p className="text-sm text-white mt-0.5">{new Date(booking.checkInDate).toDateString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-white/40 uppercase tracking-wider">{translate('checkOut')}</p>
                                            <p className="text-sm text-white mt-0.5">{new Date(booking.checkOutDate).toDateString()}</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col items-start gap-2 shrink-0">
                                        {booking.status === BOOKING_STATUS.RESERVATION && (
                                            <span className="text-[10px] text-[#F59E0B] px-2 py-0.5 rounded-full border border-[#F59E0B]/30 bg-[#F59E0B]/10 font-medium">
                                                Reservation
                                            </span>
                                        )}
                                        {booking.status === BOOKING_STATUS.CANCELLED && (
                                            <p className="text-xs text-red-400 font-medium">{translate('bookingCancelled')}</p>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2.5 w-2.5 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`} />
                                            <p className={`text-xs ${booking.isPaid ? "text-green-400" : "text-red-400"}`}>
                                                {booking.isPaid ? translate('paid') : translate('unpaid')}
                                            </p>
                                        </div>
                                        <p className="text-xs text-white/40">{translate('method')}: {booking.paymentMethod || "Pay At Hotel"}</p>

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
                                                    className="text-xs px-4 py-2 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition disabled:opacity-60"
                                                >
                                                    {cancelingId === booking._id ? translate('cancelling') : translate('cancelBooking')}
                                                </button>
                                            )}
                                            {booking.status === BOOKING_STATUS.CONFIRMED && (
                                                <button
                                                    onClick={() => setServiceModal({ open: true, roomId: booking.room?._id, hotelId: booking.hotel?._id })}
                                                    className="text-xs px-4 py-2 rounded-full border border-[#D4A85F]/30 text-[#F5D08A] hover:bg-[#D4A85F]/10 transition"
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
                                                    className="text-xs px-4 py-2 rounded-full border border-[#D4A85F]/30 text-[#F5D08A] hover:bg-[#D4A85F]/10 transition"
                                                >
                                                    Write a Review
                                                </button>
                                            )}
                                            {booking.isPaid && (
                                                <button
                                                    onClick={() => navigate(`/invoice/${booking._id}`)}
                                                    className="text-xs px-4 py-2 rounded-full border border-white/20 text-white/60 hover:text-white hover:border-white/40 transition"
                                                >
                                                    View Invoice
                                                </button>
                                            )}
                                            {booking.isPaid && booking.refundStatus === "none" && (
                                                <button
                                                    onClick={() => handleRefundRequest(booking._id)}
                                                    disabled={refundingId === booking._id}
                                                    className="text-xs px-4 py-2 rounded-full border border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition disabled:opacity-60"
                                                >
                                                    {refundingId === booking._id ? "Requesting..." : "Request Refund"}
                                                </button>
                                            )}
                                            {booking.refundStatus === "pending" && (
                                                <span className="text-[10px] text-yellow-400 px-2 py-1 rounded-full border border-yellow-500/30 bg-yellow-500/10 text-center">
                                                    Refund Pending
                                                </span>
                                            )}
                                            {booking.refundStatus === "approved" && (
                                                <span className="text-[10px] text-green-400 px-2 py-1 rounded-full border border-green-500/30 bg-green-500/10 text-center">
                                                    Refund Approved
                                                </span>
                                            )}
                                            {booking.refundStatus === "denied" && (
                                                <span className="text-[10px] text-red-400 px-2 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-center">
                                                    Refund Denied
                                                </span>
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
                        <h3 className="text-lg font-playfair text-white">Write a Review</h3>
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
                                <label className="block text-sm font-medium text-white/70 mb-2">Rating</label>
                                <StarInput value={reviewForm.rating} onChange={(val) => setReviewForm((p) => ({ ...p, rating: val }))} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-white/70 mb-2">Satisfaction</label>
                                <select
                                    value={reviewForm.satisfaction}
                                    onChange={(e) => setReviewForm((p) => ({ ...p, satisfaction: e.target.value }))}
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
                                    Comment <span className="text-white/30 font-normal">({500 - reviewForm.comment.length} characters left)</span>
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
                                <button type="button" onClick={() => setReviewModal({ open: false, booking: null })} className="text-sm text-white/50 hover:text-white transition">
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
