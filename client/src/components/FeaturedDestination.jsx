// FeaturedDestination — Curated hotel collection with horizontal scroll carousel
import React, { useRef } from "react";
import { motion } from "framer-motion";
import HotelCard from "./HotelCard";
import Title from "./Title";
import { useAppContext } from "../context/AppContext";

const SkeletonCard = () => (
  <div className="w-72 flex-shrink-0 animate-pulse">
    <div className="rounded-[24px] border border-white/10 overflow-hidden">
      <div className="h-48 bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 rounded bg-white/5" />
        <div className="h-3 w-1/2 rounded bg-white/5" />
        <div className="h-3 w-2/3 rounded bg-white/5" />
        <div className="h-10 w-full rounded bg-white/5 mt-4" />
      </div>
    </div>
  </div>
);

const FeaturedDestination = () => {
  const { rooms, navigate } = useAppContext();
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="luxury-section">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center space-y-8">
          <Title
            kicker="Curated Collection"
            title="Featured Destination"
            subtitle="Discover our handpicked selection of exceptional properties around the world, offering unparalleled luxury and unforgettable experiences."
          />

          <div className="relative w-full group/scroll">
            <button
              onClick={() => scroll(-1)}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-[#07111f]/90 border border-white/10 text-white/60 hover:text-white hover:border-white/30 backdrop-blur-xl opacity-0 group-hover/scroll:opacity-100 transition-all"
              aria-label="Scroll left"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-hide">
              <div className="flex gap-6 pb-4 min-w-max">
                {rooms.length === 0
                  ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                  : rooms.slice(0, 8).map((room, index) => (
                      <motion.div
                        key={room._id || room.id}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.06 }}
                        className="w-72 flex-shrink-0"
                      >
                        <HotelCard room={room} index={index} />
                      </motion.div>
                    ))}
              </div>
            </div>
            <button
              onClick={() => scroll(1)}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-[#07111f]/90 border border-white/10 text-white/60 hover:text-white hover:border-white/30 backdrop-blur-xl opacity-0 group-hover/scroll:opacity-100 transition-all"
              aria-label="Scroll right"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>

          <motion.button
            whileHover={{ y: -2 }}
            onClick={() => {
              navigate("/rooms");
              scrollTo(0, 0);
            }}
            className="gold-button px-8 py-3 text-sm uppercase tracking-[0.18em]"
          >
            View All Destinations
          </motion.button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDestination;
