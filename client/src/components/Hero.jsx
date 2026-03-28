import React, { useState } from "react";
import { assets, cities } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import heroImage from "../assets/heroimage.jpg";

const Hero = () => {
  const { user, isOwner, navigate } = useAppContext();
  const ownerEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const effectiveOwner = isOwner || ownerEmail === "mbmafrij@gmail.com";
  const [destination, setDestination] = useState("");

  const handleSearch = (event) => {
    event.preventDefault();
    const target = destination.trim();

    if (target) {
      navigate(`/rooms?destination=${encodeURIComponent(target)}`);
      return;
    }
    navigate("/rooms");
  };

  return (
    <section className="relative min-h-[90vh] overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/30 to-slate-950/80" />
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-400/30 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-[90vh] max-w-[1200px] flex-col justify-center px-6 md:px-12 lg:px-16">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white">
            The Ultimate Hotel Experience
          </p>
          <h1 className="mt-5 font-playfair text-4xl md:text-6xl font-semibold leading-tight text-white">
            Discover Your Perfect
            <span className="block text-amber-200">Gateway Destination</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-100/90">
            Unparalleled luxury and comfort await at the world's most exclusive hotels and resorts.
            Start your journey today.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="mt-10 w-full max-w-5xl flex flex-col sm:flex-row gap-3 items-center justify-center"
        >
          {/* Destination */}
          <div className="relative w-full sm:w-auto">
            <select
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              className="appearance-none rounded-full bg-white px-6 py-2 text-sm font-medium text-slate-700 shadow-md hover:shadow-lg transition border border-slate-200 cursor-pointer pr-10 min-w-[160px]"
            >
              <option value="">Select Destination</option>
              {cities.map((city, index) => (
                <option key={index} value={city}>{city}</option>
              ))}
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Check In */}
          <div className="relative w-full sm:w-auto">
            <input
              id="checkIn"
              type="date"
              className="rounded-full bg-white px-6 py-2 text-sm font-medium text-slate-700 shadow-md hover:shadow-lg transition border border-slate-200 cursor-pointer min-w-[140px]"
            />
          </div>

          {/* Check Out */}
          <div className="relative w-full sm:w-auto">
            <input
              id="checkOut"
              type="date"
              className="rounded-full bg-white px-6 py-2 text-sm font-medium text-slate-700 shadow-md hover:shadow-lg transition border border-slate-200 cursor-pointer min-w-[140px]"
            />
          </div>

          {/* Guests */}
          <div className="relative w-full sm:w-auto">
            <select
              id="guests"
              defaultValue="1"
              className="appearance-none rounded-full bg-white px-6 py-2 text-sm font-medium text-slate-700 shadow-md hover:shadow-lg transition border border-slate-200 cursor-pointer pr-10 min-w-[120px]"
            >
              <option value="1">1 Guest</option>
              <option value="2">2 Guests</option>
              <option value="3">3 Guests</option>
              <option value="4">4 Guests</option>
            </select>
            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-600 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="w-full sm:w-auto rounded-full bg-blue-600 hover:bg-blue-700 text-white px-8 py-2 text-sm font-semibold shadow-lg hover:shadow-xl transition duration-300 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
};
export default Hero;
