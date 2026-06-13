// AIPlannerSection — AI-powered trip planner UI with destination preview and prompt input
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import Title from './Title';
import { useAppContext } from '../context/AppContext';
import popularDestinations from '../data/popularDestinations';

const AIPlannerSection = () => {
  const { navigate } = useAppContext();
  const suggestions = ['Best month to go', 'Private airport transfer', 'Sunset suite', 'Wellness retreat'];

  const previewDest = useMemo(() => {
    const randomIndex = Math.floor(Math.random() * popularDestinations.length);
    return popularDestinations[randomIndex];
  }, []);

  return (
    <section id="ai-planner" className="luxury-section">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="luxury-card relative overflow-hidden p-6 md:p-8">
          <Title
            align="left"
            kicker="AI Trip Planner"
            title="Shape a quieter, more curated itinerary in minutes"
            subtitle="Use the planner to build a trip around mood, season, and pace instead of just dates and rooms."
          />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {suggestions.map((item) => (
              <div key={item} className="luxury-card-soft px-4 py-4 text-sm text-white/82">
                {item}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <button onClick={() => navigate('/trip-planner')} className="gold-button px-6 py-4 text-sm">Open Trip Planner</button>
            <button onClick={() => navigate('/trip-planner')} className="ghost-button px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em]">Use AI suggestions</button>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.7 }}
          className="luxury-card-soft relative overflow-hidden p-6 md:p-8"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(212,168,95,0.14),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_26%)]" />
          <div className="relative space-y-4">
            <p className="font-space text-xs uppercase tracking-[0.24em] text-white/50">Preview</p>
            <p className="font-playfair text-3xl text-white">3 nights in {previewDest.name}</p>
            <div className="space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                <span>{previewDest.name} stay</span>
                <span className="text-[#F5D08A]">2 nights</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                <span>Wellness spa afternoon</span>
                <span className="text-[#F5D08A]">Included</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                <span>Private transfer</span>
                <span className="text-[#F5D08A]">Premium</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIPlannerSection;