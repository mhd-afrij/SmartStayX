// Hero — Landing page hero with search bar, background image, and booking CTA
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { assets, cities } from "../assets/assets";
import { useAppContext } from "../context/AppContext";

const heroImages = [
  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1920",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920",
  "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920",
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?w=1920",
  "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1920",
  "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1920",
];

const motionItem = {
  hidden: { opacity: 0, y: 30 },
  visible: (custom) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: custom, ease: "easeOut" }
  })
};

const Hero = () => {
  const { user, isOwner, navigate } = useAppContext();
  const ownerEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const effectiveOwner = isOwner || ownerEmail === "mbmafrij@gmail.com";
  const [destination, setDestination] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState("2");
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % heroImages.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(nextImage, 6000);
    return () => clearInterval(timer);
  }, [nextImage]);

  const handleSearch = (event) => {
    event.preventDefault();
    const target = destination.trim();
    const searchParams = new URLSearchParams();

    if (target) searchParams.set("destination", target);
    if (checkIn) searchParams.set("checkIn", checkIn);
    if (checkOut) searchParams.set("checkOut", checkOut);
    if (guests) searchParams.set("guests", guests);

    if (target) {
      navigate(`/rooms?${searchParams.toString()}`);
      return;
    }
    navigate("/rooms");
  };

  return (
    <section className="luxury-shell relative isolate min-h-screen overflow-hidden pt-28 pb-12 flex items-center md:pt-32 md:pb-16">
      {/* Rotating gallery background */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            aria-hidden="true"
            className="absolute inset-0"
            initial={{ opacity: 0, scale: 1.15 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          >
            <motion.div
              className="h-full w-full"
              initial={{ scale: 1 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
            >
              <img
                src={heroImages[currentIndex]}
                alt=""
                className="h-full w-full object-cover"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image counter dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2.5">
        {heroImages.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              i === currentIndex ? "w-8 bg-[#D4A85F]" : "w-1.5 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.25)_0%,rgba(7,17,31,0.55)_40%,rgba(7,17,31,0.92)_100%)]" />

      {/* Hero copy and booking form */}
      <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 md:px-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-12">
         <motion.div
           variants={motionItem}
           initial="hidden"
           animate="visible"
           custom={0.05}
           className="max-w-2xl lg:self-center"
         >
          {/* Intro copy */}
          <div className="luxury-kicker inline-flex items-center gap-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80">
            <span className="h-px w-8 bg-gradient-to-r from-transparent via-[#D4A85F] to-transparent" />
            The Ultimate Hotel Experience
          </div>

          <h1 className="font-playfair mt-7 max-w-4xl text-[clamp(3rem,7vw,6.2rem)] leading-[0.95] tracking-[-0.05em] text-white">
            Discover Your Perfect <span className="text-[#D4A85F]">Gateway</span> Destination
          </h1>

          <p className="luxury-copy mt-6 max-w-2xl text-[1.02rem] md:text-[1.08rem]">
            Browse handpicked resorts, cinematic city escapes, and private sanctuaries designed for travelers who expect calm, comfort, and a little ceremony in every arrival.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link to="/rooms" className="gold-button px-7 py-4 text-sm">
              Explore Stays
              <img src={assets.arrowIcon} alt="arrow" className="w-4" />
            </Link>
            <Link to="/trip-planner" className="ghost-button px-7 py-4 text-sm font-semibold text-white/92">
              Plan a Luxury Trip
            </Link>
          </div>


        </motion.div>

        <motion.div
           variants={motionItem}
           initial="hidden"
           animate="visible"
           custom={0.2}
           className="relative lg:self-center"
         >
          {/* Search form card */}
          <div className="luxury-card relative overflow-hidden p-4 md:p-6 shadow-[0_30px_100px_rgba(0,0,0,0.38)]">
            <form onSubmit={handleSearch} className="relative space-y-4">
              {/* Search filters */}
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.45fr_1fr_1fr_0.9fr]">
                <label className="space-y-2">
                  <span className="luxury-kicker text-white/55">Destination</span>
                  <select
                    value={destination}
                    onChange={(event) => setDestination(event.target.value)}
                    className="luxury-select"
                  >
                    <option value="" className="bg-[#0d1728]">Where are you going?</option>
                    {cities.map((city) => (
                      <option key={city} value={city} className="bg-[#0d1728]">
                        {city}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="luxury-kicker text-white/55">Check-in</span>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(event) => setCheckIn(event.target.value)}
                    className="luxury-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="luxury-kicker text-white/55">Check-out</span>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(event) => setCheckOut(event.target.value)}
                    className="luxury-input"
                  />
                </label>

                <label className="space-y-2">
                  <span className="luxury-kicker text-white/55">Guests</span>
                  <select value={guests} onChange={(event) => setGuests(event.target.value)} className="luxury-select">
                    {[1, 2, 3, 4, 5, 6].map((guestCount) => (
                      <option key={guestCount} value={guestCount} className="bg-[#0d1728]">
                        {guestCount} Guest{guestCount > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              {/* Submit action */}
              <button type="submit" className="gold-button mt-2 w-full px-6 py-4 text-sm uppercase tracking-[0.22em]">
                <img src={assets.searchIcon} alt="search" className="w-4" />
                Search Luxury Stays
              </button>
            </form>
          </div>

        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
