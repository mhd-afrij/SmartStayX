import { useState, useEffect } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MyBookings = () => {
    const {user, axios, getToken} = useAppContext()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    const fetchUserBookings = async () => {
        setLoading(true)
        try {
            const token = await getToken();
            if (!token) {
                toast.error("Please sign in to view your bookings");
                setLoading(false)
                return;
            }
            
            const {data} = await axios.get('/api/bookings/user', {
                headers: { Authorization: `Bearer ${token}` }
            })
            
            if(data.success){
                setBookings(data.bookings || [])
            } else {
                toast.error(data.message || "Failed to fetch bookings")
                setBookings([])
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || "Failed to fetch bookings";
            toast.error(errorMessage)
            setBookings([])
            console.error("Error fetching bookings:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if(user){
            fetchUserBookings()
        }
    }, [user])

    
  return (
    <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>

        <Title title='My Bookings' subtitle='Easily manage your past, current, and upcoming Hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left'/>

        <div className='max-w-6xl mt-8 w-full text-gray-800'>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading bookings...</p>
                    </div>
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-gray-500 text-lg">No bookings found</p>
                    <p className="text-gray-400 text-sm mt-2">You haven't made any bookings yet.</p>
                </div>
            ) : (
                <>
                    <div className='hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3'>
                        <div className='w-1/3'>Hotels</div>
                        <div className='w-1/3'>Date & Timings</div>
                        <div className='w-1/3'>Payment</div>
                    </div>

                    {bookings.map((booking) => (
                <div key={booking._id} className='grid grid-cols-1 md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 py-6 first:border-t'>
                    
                    {/*------Hotel Details----*/ }
                    <div className='flex flex-col md:flex-row'>
                        <img src={booking.room.images[0]} alt="hotel-img" className='min-md:w-44 rounded shadow object-cover' />
                        <div className='flex flex-col gap-1.5 max-md:mt-3 min-md:ml-4'>
                            <p className='font-playfair text-2xl'>{booking.hotel.name}
                                <span className='font-inter text-sm'>  ({booking.room.roomType})</span>
                            </p>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.locationIcon} alt="location-icon"  />
                                <span>{booking.hotel.address}</span>
                            </div>
                            <div className='flex items-center gap-1 text-sm text-gray-500'>
                                <img src={assets.guestsIcon} alt="guest-icon"  />
                                <span>Guests:{booking.guests}</span>
                            </div>
                            <p className='text-base'>Total:${booking.totalPrice}</p>
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
                        <div className='flex items-center gap-2'>
                            <div className={`h-5 w-5 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`}></div>
                            <p className={`text-sm ${booking.isPaid ? "text-green-500" : "text-red-500"}`}>
                                {booking.isPaid ? "Paid" : "UnPaid"}
                            </p>
                        </div>
                        {!booking.isPaid &&(
                            <button className='px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer'>
                                Pay Now
                            </button>
                        )}
                    </div>

                </div>
                    ))}
                </>
            )}
        </div>
    </div>
  )
}

export default MyBookings
