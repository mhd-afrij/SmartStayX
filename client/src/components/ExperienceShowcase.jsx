// ExperienceShowcase — Experiences and local activities showcase section
import React from 'react';
import { motion } from 'framer-motion';
import Title from './Title';
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';

const ExperienceShowcase = () => {
  const { navigate } = useAppContext();
  const experiences = [
    { title: 'Beach Resorts', image: 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Mountain Retreats', image: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Wellness Spas', image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop' },
    { title: 'City Luxury', image: 'https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?q=80&w=1200&auto=format&fit=crop' },
    { title: 'Adventure Trips', image: 'https://images.unsplash.com/photo-1500835556837-99ac94a94552?q=80&w=1200&auto=format&fit=crop' },
  ];

  return (
    <section id="experiences" className="luxury-section">
      <div className="mx-auto max-w-7xl space-y-8">
        <Title
          align="left"
          kicker="Experience categories"
          title="Immersive categories designed like a private travel reel"
          subtitle="Move through broad moods rather than a generic hotel grid, with each card carrying its own visual pace and tone."
        />

        <div className="flex gap-5 overflow-x-auto pb-3 scrollbar-hide">
          {experiences.map((experience, index) => (
            <motion.article
              key={experience.title}
              whileHover={{ y: -6, scale: 1.01 }}
              transition={{ duration: 0.24 }}
              className={`relative min-w-[18rem] flex-1 overflow-hidden rounded-[28px] border border-white/10 ${index === 0 ? 'h-[26rem]' : 'h-[22rem]'}`}
            >
              <img src={experience.image} alt={experience.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 hover:scale-110" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.12)_0%,rgba(7,17,31,0.78)_58%,rgba(7,17,31,0.96)_100%)]" />
              <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] text-white/80 backdrop-blur-xl">
                Curated moment
              </div>
              <div className="absolute bottom-5 left-5 right-5">
                <p className="font-playfair text-3xl text-white">{experience.title}</p>
                <p className="mt-3 text-sm leading-7 text-white/72">Luxury that shifts with the rhythm of your trip.</p>
                <button
                  onClick={() => navigate(`/rooms`)}
                  className="mt-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[#F5D08A] transition-all hover:gap-3"
                >
                  <span>Explore</span>
                  <img src={assets.arrowIcon} alt="arrow" className="w-4" />
                </button>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ExperienceShowcase;