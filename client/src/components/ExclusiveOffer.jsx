import React, { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { assets } from '../assets/assets'
import Title from './Title'
import { useAppContext } from '../context/AppContext'

const ExclusiveOffer = () => {
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
        <section className="luxury-section">
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row items-end justify-between gap-4 mb-10">
                    <Title
                        align="left"
                        kicker="Limited Edition"
                        title="Exclusive Offers"
                        subtitle="Take advantage of our limited-time offers and special packages to enhance your stay and create unforgettable memories."
                    />
                    <Link
                        to="/rooms"
                        className="ghost-button px-6 py-3 text-sm uppercase tracking-[0.18em] flex-shrink-0"
                    >
                        View All Offers
                        <img src={assets.arrowIcon} alt="arrow" className="w-3.5" />
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offerList.length === 0 ? (
                        <>
                            {[1, 2, 3].map((placeholder) => (
                                <div
                                    key={placeholder}
                                    className="flex flex-col justify-end overflow-hidden rounded-[28px] border border-white/10 min-h-[22rem] bg-[#0d1728] animate-pulse"
                                >
                                    <div className="p-6 md:p-7 space-y-3">
                                        <div className="h-6 w-1/2 rounded bg-white/5" />
                                        <div className="h-4 w-3/4 rounded bg-white/5" />
                                        <div className="h-3 w-1/3 rounded bg-white/5" />
                                        <div className="h-4 w-1/4 rounded bg-white/5 mt-4" />
                                    </div>
                                </div>
                            ))}
                            <div className="lg:col-span-3 flex items-center justify-center py-6">
                                <p className="text-sm text-white/40">No active offers — check back soon for exclusive packages.</p>
                            </div>
                        </>
                    ) : (
                        offerList.map((item, index) => {
                        const roomId = item.room?._id || item.room;
                        const ctaHref = roomId ? `/rooms/${roomId}` : '/rooms';
                        const image = item.image || item.imageUrl || item.fallbackImage || item.imageLink;

                        return (
                            <motion.div
                                key={item._id || item.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.08 }}
                                className="group relative flex flex-col justify-end overflow-hidden rounded-[28px] border border-white/10 min-h-[22rem]"
                            >
                                {image ? (
                                    <img src={image} alt={item.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="absolute inset-0 bg-[#0d1728]" />
                                )}
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.02)_0%,rgba(7,17,31,0.72)_56%,rgba(7,17,31,0.96)_100%)]" />

                                <div className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-[#F5D08A] backdrop-blur-xl font-semibold">
                                    {item.discountPercent ?? item.priceOff}% OFF
                                </div>

                                <div className="relative p-6 md:p-7">
                                    <p className="font-playfair text-2xl text-white md:text-3xl">{item.title}</p>
                                    <p className="mt-2 text-sm text-white/70">{item.description}</p>
                                    <p className="mt-2 text-xs text-white/50">Expires {formatExpiry(item.expiryDate)}</p>

                                    <Link
                                        to={ctaHref}
                                        onClick={() => window.scrollTo(0, 0)}
                                        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#F5D08A] transition-all hover:gap-3"
                                    >
                                        Book this room
                                        <img src={assets.arrowIcon} alt="arrow" className="w-3.5" />
                                    </Link>
                                </div>
                            </motion.div>
                        );
                    }))}
                </div>
            </div>
        </section>
    )
}

export default ExclusiveOffer
