import React from "react";
import { useAppContext } from "../context/AppContext";

const TripPlanner = () => {
  const { navigate } = useAppContext();

  return (
    <div className="min-h-screen bg-slate-50 px-6 md:px-16 lg:px-24 pt-28 pb-16">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm text-center">
          <p className="inline-block text-xs uppercase tracking-[0.25em] text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Trip Planner
          </p>
          <h1 className="mt-4 text-3xl md:text-5xl font-playfair font-bold text-slate-900">
            Coming Soon
          </h1>
          <p className="mt-4 text-slate-600 text-base md:text-lg">
            We are building a smarter trip planning experience with personalized itineraries,
            interactive maps, and local attraction recommendations.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => {
                navigate("/rooms");
                scrollTo(0, 0);
              }}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Explore Hotels
            </button>
            <button
              onClick={() => {
                navigate("/");
                scrollTo(0, 0);
              }}
              className="px-8 py-3 border border-slate-400 text-slate-800 rounded-lg font-semibold hover:bg-slate-100 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
