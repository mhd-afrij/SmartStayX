import React, { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { assets } from '../assets/assets'
import Title from './Title'
import { useAppContext } from '../context/AppContext'

const ExclusiveOffer = () => {
    const navigate = useNavigate();
    const { offers } = useAppContext();

    const offerList = useMemo(() => offers || [], [offers]);

    const formatExpiry = (value) => {
        if (!value) return "Limited time";
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime())
            ? value
            : parsed.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    };

    return (
        <div className='flex flex-col items-center px-6 md:px-16 lg:px-24 xl:px-32 pt-20 pb-30'>
            <div className='flex flex-col md:flex-row items-center justify-between w-full'>
                <Title align='left' title='Exclusive Offers' subtitle='Take advantage of our limited-time offers and special packages to enhance your stay and create unforgettable memories.' />
                <button
                    onClick={() => navigate('/rooms')}
                    className='group flex items-center gap-2 mt-6 md:mt-0 px-4 py-2 text-sm font-medium border border-gray-300 rounded bg-white hover:bg-gray-50 transition-all cursor-pointer'
                >
                    View All Offers!
                    <img src={assets.arrowIcon} alt="arrow-icon"
                        className='group-hover:translate-x-1 transition-transform-all' />
                </button>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12'>
                {offerList.map((item) => {
                    const roomId = item.room?._id || item.room;
                    const ctaHref = roomId ? `/rooms/${roomId}` : '/rooms';
                    const image = item.image || item.imageUrl || item.fallbackImage || item.imageLink;

                    return (
                        <div
                            key={item._id || item.title}
                            className='group relative flex flex-col items-start justify-between gap-1 pt-12 md:pt-18 px-4 rounded-xl text-white bg-no-repeat bg-cover bg-center h-72 md:h-96 mt-10'
                            style={image ? { backgroundImage: `url(${image})` } : {}}
                        >
                            <p className='px-3 py-1 absolute top-4 left-4 text-xs bg-black text-white rounded-full font-medium'>{item.discountPercent ?? item.priceOff}% OFF</p>
                            <div>
                                <p className='text-2xl font-medium font-playfair'>{item.title}</p>
                                <p>{item.description}</p>
                                <p className='text-xs text-white/70 mt-3'>Expires {formatExpiry(item.expiryDate)}</p>
                            </div>

                            <Link
                                to={ctaHref}
                                onClick={() => scrollTo(0, 0)}
                                className='flex items-center gap-2 font-medium cursor-pointer mt-4 mb-5'
                            >
                                Book this room
                                <img src={assets.arrowIcon} alt="arrow-icon"
                                    className='invert group-hover:translate-x-1 transition--all' />
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

export default ExclusiveOffer