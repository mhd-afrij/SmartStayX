import { useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets, placeholderImage } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import ServicePortal from '../components/ServicePortal'
import BookingService from '../services/BookingService'
import { BOOKING_STATUS } from '../constants/bookingStatuses'
import { FALLBACK_VALUES } from '../constants/pricingConfig'

const MyBookings = () => {
    const { getToken, formatPrice, translate, user } = useAppContext();
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [payingId, setPayingId] = useState(null)
    const [cancelingId, setCancelingId] = useState(null)
    const [serviceModal, setServiceModal] = useState({ open: false, roomId: null, hotelId: null })

    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const latestConfirmed = confirmedBookings[confirmedBookings.length - 1];

    const openServiceFor = (roomId, hotelId) => {
        setServiceModal({ open: true, roomId, hotelId });
    };

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

    const getPricingBreakdown = (booking) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);
        const milliseconds = checkOut.getTime() - checkIn.getTime();
        const fallbackNights = Math.max(1, Math.ceil(milliseconds / (1000 * 3600 * 24)));

        const nights = booking.nights || fallbackNights;
        const basePerNight = booking.basePricePerNight ?? booking.room?.pricePerNight ?? 0;
        const dynamicPerNight = booking.dynamicPricePerNight ?? booking.totalPrice / nights;
        const multiplier = booking.priceMultiplier ?? (basePerNight > 0 ? dynamicPerNight / basePerNight : 1);

        const baseTotal = Number((basePerNight * nights).toFixed(2));
        const surgeAmount = Number((booking.totalPrice - baseTotal).toFixed(2));

        return { nights, basePerNight, dynamicPerNight, multiplier, surgeAmount };
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
                        const pricing = getPricingBreakdown(booking);
                        const nightLabel = pricing.nights > 1 ? translate('nights') : translate('night');
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
                                            {booking.hotel?.name || FALLBACK_VALUES.HOTEL_NAME}
                                            <span className="font-inter text-sm text-white/50 ml-2">
                                                ({booking.room?.roomType || FALLBACK_VALUES.ROOM_TYPE})
                                            </span>
                                        </p>
                                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                                            <img src={assets.locationIcon} alt="location-icon" className="w-4 h-4 opacity-60" />
                                            <span>{booking.hotel?.address || FALLBACK_VALUES.ADDRESS}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm text-white/50">
                                            <img src={assets.guestsIcon} alt="guest-icon" className="w-4 h-4 opacity-60" />
                                            <span>{translate('guests')}: {booking.guests}</span>
                                        </div>
                                        <p className="text-sm text-white mt-1">
                                            {translate('total')}: <span className="text-[#F5D08A] font-medium">{formatPrice(booking.totalPrice)}</span>
                                        </p>
                                        <div className="text-xs text-white/40 leading-5">
                                            <p>{translate('base')}: {formatPrice(pricing.basePerNight)} x {pricing.nights} {nightLabel}</p>
                                            <p>{translate('dynamic')}: {formatPrice(pricing.dynamicPerNight)}/{translate('night')} ({pricing.multiplier.toFixed(2)}x)</p>
                                            {pricing.surgeAmount > 0 && <p>{translate('surge')}: +{formatPrice(pricing.surgeAmount)}</p>}
                                        </div>
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
                                            {!booking.isPaid && booking.status !== BOOKING_STATUS.CANCELLED && (
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
        </div>
    )
}

export default MyBookings
