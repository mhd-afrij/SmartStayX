import  { useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import ServicePortal from '../components/ServicePortal'

const MyBookings = () => {
    const { axios, getToken, formatPrice } = useAppContext();
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [payingId, setPayingId] = useState(null)
    const [cancelingId, setCancelingId] = useState(null)
    const [serviceModal, setServiceModal] = useState({ open: false, roomId: null, hotelId: null })

    const fetchBookings = async ({ showLoader = false } = {}) => {
        try {
            if (showLoader) setLoading(true);
            const { data } = await axios.get('/api/bookings/user', {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });
            if (data.success) {
                setBookings(data.bookings || []);
            } else {
                toast.error(data.message || 'Failed to load bookings');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error loading bookings');
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
                const { data } = await axios.post('/api/bookings/confirm-checkout-session', {
                    sessionId,
                }, {
                    headers: { Authorization: `Bearer ${await getToken()}` }
                });

                if (data.success && data.paid) {
                    toast.success('Payment confirmed successfully');
                } else if (data.success && !data.paid) {
                    toast('Payment is processing. Please refresh in a moment.');
                } else {
                    toast.error(data.message || 'Unable to confirm payment');
                }
            } catch (error) {
                toast.error(error.response?.data?.message || 'Unable to confirm payment');
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
            const sessionResponse = await axios.post('/api/bookings/create-checkout-session', {
                bookingId
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (!sessionResponse.data.success || !sessionResponse.data.url) {
                toast.error(sessionResponse.data.message || 'Unable to start Stripe checkout');
                return;
            }

            window.location.assign(sessionResponse.data.url);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to connect to Stripe');
        } finally {
            setPayingId(null);
        }
    };

    const handleCancelBooking = async (bookingId) => {
        if (!bookingId) return;
        setCancelingId(bookingId);
        try {
            const { data } = await axios.post('/api/bookings/cancel', {
                bookingId,
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            });

            if (data.success) {
                toast.success(data.message || 'Booking cancelled successfully');
                await fetchBookings();
            } else {
                toast.error(data.message || 'Unable to cancel booking');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Unable to cancel booking');
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
    return <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32 text-center'>Loading your bookings...</div>;
  }

  return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>

        <Title title='My Bookings' subtitle='Easily manage your past, current, and upcoming Hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left'/>

        <div className='max-w-6xl mt-8 w-full text-gray-800'>
            
            {bookings.length === 0 && !loading && (
                <p className='text-center text-gray-500 py-8'>No bookings yet. Start exploring and book your favorite hotel!</p>
            )}

            <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
                <div className='w-1/3'>Hotels</div>
                <div className='w-1/3'>Date & Timings</div>
                <div className='w-1/3'>Payment</div>
            </div>

            {bookings.map((booking) => {
                const pricing = getPricingBreakdown(booking);
                return (
                <div key={booking._id} className='grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t'>
                    
                    {/*------Hotel Details----*/ }
                    <div className='flex flex-col md:flex-row'>
                        <img src={booking.room?.images?.[0] || assets.placeholderImage} alt="hotel-img" className='min-md:w-44 rounded shadow object-cover' />
                        <div className='flex flex-col gap-1.5 max-md:mt-3 min-md:ml-4'>
                            <p className='font-playfair text-2xl'>{booking.hotel?.name || "Hotel"}
                                <span className='font-inter text-sm'>  ({booking.room?.roomType || "Room"})</span>
                            </p>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.locationIcon} alt="location-icon"  />
                                <span>{booking.hotel?.address || "Address unavailable"}</span>
                            </div>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.guestsIcon} alt="guest-icon"  />
                                <span>Guests:{booking.guests}</span>
                            </div>
                            <p className='text-base'>Total: {formatPrice(booking.totalPrice)}</p>
                            <div className='text-xs text-gray-500 leading-5'>
                                <p>Base: {formatPrice(pricing.basePerNight)} x {pricing.nights} night{pricing.nights > 1 ? "s" : ""}</p>
                                <p>Dynamic: {formatPrice(pricing.dynamicPerNight)}/night ({pricing.multiplier.toFixed(2)}x)</p>
                                {pricing.surgeAmount > 0 && <p>Surge: +{formatPrice(pricing.surgeAmount)}</p>}
                            </div>
                        </div>
                    </div>

                    {/*------Data & Timings----*/ }
                    <div className='flex flex-row md:items-center md:gap-12 mt-3 gap-8'>
                        <div>
                            <p>Check-in:</p>
                            <p className='text-gray-500 text-sm'>{new Date(booking.checkInDate).toDateString()}</p>
                        </div>
                        <div>
                            <p>Check-out:</p>
                            <p className='text-gray-500 text-sm'>{new Date(booking.checkOutDate).toDateString()}</p>
                        </div>
                    </div>

                    {/*------Payment status----*/ }
                    <div className='flex flex-col items-start justify-center pt-3'>
                            {booking.status === "cancelled" && (
                                <p className='text-xs text-red-500 mb-2 font-medium'>Booking Cancelled</p>
                            )}
                            <div className='flex items-center gap-2'>
                            <div className={`h-5 w-5 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`}></div>
                            <p className={`text-sm ${booking.isPaid ? "text-green-500" : "text-red-500"}`}>
                                {booking.isPaid ? "Paid" : "UnPaid"}
                            </p>
                        </div>
                            <p className='text-xs text-gray-500 mt-1'>Method: {booking.paymentMethod || "Pay At Hotel"}</p>
                        {!booking.isPaid && booking.status !== "cancelled" && (
                            <button
                                onClick={() => handlePayNow(booking._id)}
                                disabled={payingId === booking._id}
                                className='px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-60'
                            >
                                {payingId === booking._id ? 'Processing...' : 'Pay with Stripe'}
                            </button>
                        )}
                        {!booking.isPaid && booking.status !== "cancelled" && new Date(booking.checkInDate) > new Date() && (
                            <button
                                onClick={() => handleCancelBooking(booking._id)}
                                disabled={cancelingId === booking._id}
                                className='px-4 py-1.5 mt-2 text-xs border border-red-300 text-red-600 rounded-full hover:bg-red-50 transition-all cursor-pointer disabled:opacity-60'
                            >
                                {cancelingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}
                            </button>
                        )}
                        {booking.status === "confirmed" && (
                            <button
                                onClick={() => setServiceModal({ open: true, roomId: booking.room?._id, hotelId: booking.hotel?._id })}
                                className='px-4 py-1.5 mt-2 text-xs border border-indigo-400 text-indigo-600 rounded-full hover:bg-indigo-50 transition-all cursor-pointer'
                            >
                                Request Service
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
