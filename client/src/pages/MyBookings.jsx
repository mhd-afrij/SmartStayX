import { useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import ServicePortal from '../components/ServicePortal'
import BookingService from '../services/BookingService'
import { BOOKING_STATUS, PAYMENT_STATUS, CANCELLABLE_STATUSES, PAYABLE_STATUSES, SERVICE_ELIGIBLE_STATUSES } from '../constants/bookingStatuses'
import { FALLBACK_VALUES } from '../constants/pricingConfig'

const MyBookings = () => {
    const { getToken, formatPrice, translate } = useAppContext();
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [payingId, setPayingId] = useState(null)
    const [cancelingId, setCancelingId] = useState(null)
    const [serviceModal, setServiceModal] = useState({ open: false, roomId: null, hotelId: null })

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

        return {
            nights,
            basePerNight,
            dynamicPerNight,
            multiplier,
            surgeAmount,
        };
    };

  if (loading) {
    return <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32 text-center'>{translate('loading')}</div>;
  }

  return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>

        <Title title={translate('myBookings')} subtitle={translate('myBookingsSubtitle')} align='left'/>

        <div className='max-w-6xl mt-8 w-full text-gray-800'>

            {bookings.length === 0 && !loading && (
                <p className='text-center text-gray-500 py-8'>{translate('noBookings')}</p>
            )}

            <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
                <div className='w-1/3'>{translate('hotelsCol')}</div>
                <div className='w-1/3'>{translate('dateTimings')}</div>
                <div className='w-1/3'>{translate('payment')}</div>
            </div>

            {bookings.map((booking) => {
                const pricing = getPricingBreakdown(booking);
                const nightLabel = pricing.nights > 1 ? translate('nights') : translate('night');
                return (
                <div key={booking._id} className='grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t'>

                    {/*------Hotel Details----*/ }
                    <div className='flex flex-col md:flex-row'>
                        <img src={booking.room?.images?.[0] || assets.placeholderImage} alt="hotel-img" className='min-md:w-44 rounded shadow object-cover' />
                        <div className='flex flex-col gap-1.5 max-md:mt-3 min-md:ml-4'>
                            <p className='font-playfair text-2xl'>{booking.hotel?.name || FALLBACK_VALUES.HOTEL_NAME}
                                <span className='font-inter text-sm'>  ({booking.room?.roomType || FALLBACK_VALUES.ROOM_TYPE})</span>
                            </p>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.locationIcon} alt="location-icon"  />
                                <span>{booking.hotel?.address || FALLBACK_VALUES.ADDRESS}</span>
                            </div>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.guestsIcon} alt="guest-icon"  />
                                <span>{translate('guests')}:{booking.guests}</span>
                            </div>
                            <p className='text-base'>{translate('total')}: {formatPrice(booking.totalPrice)}</p>
                            <div className='text-xs text-gray-500 leading-5'>
                                <p>{translate('base')}: {formatPrice(pricing.basePerNight)} x {pricing.nights} {nightLabel}</p>
                                <p>{translate('dynamic')}: {formatPrice(pricing.dynamicPerNight)}/{translate('night')} ({pricing.multiplier.toFixed(2)}x)</p>
                                {pricing.surgeAmount > 0 && <p>{translate('surge')}: +{formatPrice(pricing.surgeAmount)}</p>}
                            </div>
                        </div>
                    </div>

                    {/*------Data & Timings----*/ }
                    <div className='flex flex-row md:items-center md:gap-12 mt-3 gap-8'>
                        <div>
                            <p>{translate('checkIn')}:</p>
                            <p className='text-gray-500 text-sm'>{new Date(booking.checkInDate).toDateString()}</p>
                        </div>
                        <div>
                            <p>{translate('checkOut')}:</p>
                            <p className='text-gray-500 text-sm'>{new Date(booking.checkOutDate).toDateString()}</p>
                        </div>
                    </div>

                    {/*------Payment status----*/ }
                    <div className='flex flex-col items-start justify-center pt-3'>
                            {booking.status === BOOKING_STATUS.CANCELLED && (
                                <p className='text-xs text-red-500 mb-2 font-medium'>{translate('bookingCancelled')}</p>
                            )}
                            <div className='flex items-center gap-2'>
                            <div className={`h-5 w-5 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`}></div>
                            <p className={`text-sm ${booking.isPaid ? "text-green-500" : "text-red-500"}`}>
                                {booking.isPaid ? translate('paid') : translate('unpaid')}
                            </p>
                        </div>
                            <p className='text-xs text-gray-500 mt-1'>{translate('method')}: {booking.paymentMethod || "Pay At Hotel"}</p>
                        {!booking.isPaid && booking.status !== BOOKING_STATUS.CANCELLED && (
                            <button
                                onClick={() => handlePayNow(booking._id)}
                                disabled={payingId === booking._id}
                                className='px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-60'
                            >
                                {payingId === booking._id ? translate('processing') : translate('payWithStripe')}
                            </button>
                        )}
                        {!booking.isPaid && booking.status !== BOOKING_STATUS.CANCELLED && new Date(booking.checkInDate) > new Date() && (
                            <button
                                onClick={() => handleCancelBooking(booking._id)}
                                disabled={cancelingId === booking._id}
                                className='px-4 py-1.5 mt-2 text-xs border border-red-300 text-red-600 rounded-full hover:bg-red-50 transition-all cursor-pointer disabled:opacity-60'
                            >
                                {cancelingId === booking._id ? translate('cancelling') : translate('cancelBooking')}
                            </button>
                        )}
                        {booking.status === BOOKING_STATUS.CONFIRMED && (
                            <button
                                onClick={() => setServiceModal({ open: true, roomId: booking.room?._id, hotelId: booking.hotel?._id })}
                                className='px-4 py-1.5 mt-2 text-xs border border-indigo-400 text-indigo-600 rounded-full hover:bg-indigo-50 transition-all cursor-pointer'
                            >
                                {translate('requestService')}
                            </button>
                        )}
                    </div>

                </div>
            )})}
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