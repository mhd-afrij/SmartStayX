import React from 'react';
import { motion } from 'framer-motion';
import { assets } from '../assets/assets';
import Title from './Title';
import { useAppContext } from '../context/AppContext';
import popularDestinations from '../data/popularDestinations';

const PopularDestinations = () => {
  const { navigate } = useAppContext();

  return (
    <section id="popular-destinations" className="luxury-section">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-8">
          <Title
            align="left"
            kicker="Popular Destinations"
            title="A gallery of places chosen for atmosphere, not noise"
            subtitle="Each destination is curated for cinematic architecture, warm light, and the kind of mood that makes a trip feel rare."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12" style={{ gridAutoRows: '200px' }}>
            {popularDestinations.map((destination, index) => {
              const spans = [
                'xl:col-span-7 xl:row-span-2',
                'xl:col-span-5',
                'xl:col-span-5',
                'xl:col-span-4 xl:row-span-2',
                'xl:col-span-8',
                'xl:col-span-4',
                'xl:col-span-4',
                'xl:col-span-4',
              ];
              return (
                <motion.button
                  key={destination.name}
                  type="button"
                  onClick={() => navigate(`/blog?destination=${encodeURIComponent(destination.name)}`)}
                  whileHover={{ y: -4 }}
                  className={`group relative overflow-hidden rounded-[24px] border border-white/10 text-left ${spans[index]}`}
                >
                  <img
                    src={destination.image}
                    alt={destination.name}
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#07111f]/95 via-[#07111f]/40 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.65rem] uppercase tracking-[0.2em] text-white/80 backdrop-blur-xl">
                    {destination.hotels} · {destination.temp}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 p-5 md:p-6">
                    <p className={`font-playfair text-white ${index === 0 ? 'text-4xl md:text-5xl' : index === 4 ? 'text-3xl md:text-4xl' : 'text-2xl md:text-3xl'}`}>
                      {destination.name}
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                      {destination.description}
                    </p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#F5D08A] opacity-0 transition-all duration-300 group-hover:opacity-100">
                      <span>View destination</span>
                      <img src={assets.arrowIcon} alt="arrow" className="w-3.5" />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PopularDestinations;
