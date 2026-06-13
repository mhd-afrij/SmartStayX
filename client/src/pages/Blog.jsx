// Blog — Travel insights, articles, and blog post listings
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';

const blogData = {
  Maldives: {
    title: "Maldives: Where Waters Whisper and Luxury Lives on the Tide",
    intro: "Imagine waking up to the gentle lap of turquoise waters beneath your overwater villa, the sun casting golden ribbons across an endless horizon. The Maldives is not just a destination — it is a feeling of weightlessness, of being suspended between sky and sea.",
    highlights: [
      { label: "Best Time to Visit", value: "November — April" },
      { label: "Top Experiences", value: "Overwater dining, sunset cruises, manta ray snorkeling" },
      { label: "Vibe", value: "Romantic, serene, ultra-luxury" },
    ],
    tips: [
      "Book a seaplane transfer for breathtaking aerial views of the atolls.",
      "Dine at Ithaa Undersea Restaurant — the world's first all-glass underwater restaurant.",
      "Opt for a private sandbank dinner for an unforgettable evening.",
    ],
    image: "https://images.unsplash.com/photo-1514282401047-d79a71a590e8?q=80&w=1400&auto=format&fit=crop",
  },
  Dubai: {
    title: "Dubai: The City of Tomorrow, Rooted in Timeless Grandeur",
    intro: "From the shimmering spire of Burj Khalifa to the golden dunes of the Arabian Desert, Dubai is a city that dares to dream bigger. It is a place where ancient souks meet futuristic skylines, and every corner promises an encounter with the extraordinary.",
    highlights: [
      { label: "Best Time to Visit", value: "November — March" },
      { label: "Top Experiences", value: "Desert safari, Burj Khalifa sunset, Dubai Marina yacht tour" },
      { label: "Vibe", value: "Extravagant, dynamic, cosmopolitan" },
    ],
    tips: [
      "Visit the Dubai Mall at dusk — the fountains and skyline are magical.",
      "Book a table at atmosphere, the highest restaurant in the world on Burj Khalifa's 122nd floor.",
      "Don't miss the Al Fahidi Historical District for a taste of old Dubai.",
    ],
    image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=1400&auto=format&fit=crop",
  },
  Bali: {
    title: "Bali: The Island of Gods, Where Spirit Meets Serenity",
    intro: "Bali is a place where emerald rice terraces cascade down hillsides, ancient temples stand guard over volcanic peaks, and the air is thick with the scent of frangipani and incense. It is a sanctuary for the soul.",
    highlights: [
      { label: "Best Time to Visit", value: "April — October" },
      { label: "Top Experiences", value: "Tegallalang Rice Terraces, Uluwatu Temple, Ubud Monkey Forest" },
      { label: "Vibe", value: "Spiritual, artistic, tropical" },
    ],
    tips: [
      "Wake up early for a sunrise trek up Mount Batur — the view is worth every step.",
      "Take a traditional Balinese cooking class in Ubud.",
      "Stay in a villa with a private pool surrounded by jungle for the full experience.",
    ],
    image: "https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?q=80&w=1400&auto=format&fit=crop",
  },
  Tokyo: {
    title: "Tokyo: The Pulse of Now, Wrapped in Centuries of Grace",
    intro: "Tokyo is a city of beautiful contradictions — neon-lit skyscrapers standing beside ancient Shinto shrines, robotic restaurants a short walk from tranquil Zen gardens. It is a place that honors its past while racing into the future.",
    highlights: [
      { label: "Best Time to Visit", value: "March — May & September — November" },
      { label: "Top Experiences", value: "Shibuya Crossing, Meiji Shrine, Tsukiji Outer Market, Shinjuku nightlife" },
      { label: "Vibe", value: "Electric, respectful, endlessly surprising" },
    ],
    tips: [
      "Visit during cherry blossom season (late March–early April) for an unforgettable experience.",
      "Book a private omakase dinner for the finest sushi of your life.",
      "Explore the quiet alleys of Yanaka for a glimpse of old Tokyo.",
    ],
    image: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=1400&auto=format&fit=crop",
  },
  Switzerland: {
    title: "Switzerland: Alpine Silence, Crystal Peaks, and Chalet Dreams",
    intro: "Switzerland is nature's masterpiece — snow-capped peaks reflected in mirror-like lakes, charming villages nestled in valleys, and the crisp, clean air of the Alps. It is a retreat for those seeking stillness and grandeur in equal measure.",
    highlights: [
      { label: "Best Time to Visit", value: "June — August & December — March" },
      { label: "Top Experiences", value: "Jungfraujoch railway, Lake Geneva cruise, Zermatt skiing" },
      { label: "Vibe", value: "Tranquil, majestic, outdoorsy" },
    ],
    tips: [
      "Take the Glacier Express for one of the most scenic train journeys in the world.",
      "Stay in a traditional wooden chalet in Grindelwald for an authentic Alpine experience.",
      "Indulge in fondue and raclette at a mountain hut after a day on the slopes.",
    ],
    image: "https://images.unsplash.com/photo-1505764706515-aa95265c5abc?q=80&w=1400&auto=format&fit=crop",
  },
  "New York": {
    title: "New York: The City That Never Sleeps, Where Dreams Take Flight",
    intro: "New York is an energy — a pulsing, electric rhythm that draws you in from the moment you step onto its streets. From the neon glow of Times Square to the serene pathways of Central Park, every block tells a story of ambition, culture, and reinvention.",
    highlights: [
      { label: "Best Time to Visit", value: "April — June & September — November" },
      { label: "Top Experiences", value: "Statue of Liberty, Broadway show, rooftop bars, world-class museums" },
      { label: "Vibe", value: "Energetic, iconic, endlessly diverse" },
    ],
    tips: [
      "Book Broadway tickets in advance for the best seats and prices.",
      "Take the Staten Island Ferry for free skyline views of the Statue of Liberty.",
      "Explore neighborhoods beyond Manhattan — Brooklyn and Astoria offer incredible food and culture.",
    ],
    image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=1400&auto=format&fit=crop",
  },
  Singapore: {
    title: "Singapore: Where the Future Blooms in a Garden City",
    intro: "Singapore is a vision of tomorrow — a gleaming city-state where futuristic architecture rises above lush rainforest canopies. It is a harmonious blend of cultures, cuisines, and cutting-edge design, all wrapped in impeccable greenery.",
    highlights: [
      { label: "Best Time to Visit", value: "February — April" },
      { label: "Top Experiences", value: "Gardens by the Bay, Marina Bay Sands infinity pool, Hawker Centre food trail" },
      { label: "Vibe", value: "Futuristic, clean, multicultural" },
    ],
    tips: [
      "Visit the Supertree Grove at night for the free Garden Rhapsody light-and-sound show.",
      "Eat your way through Chinatown, Little India, and Kampong Glam for the city's best street food.",
      "Book a table at a rooftop bar overlooking the Marina Bay skyline for sunset cocktails.",
    ],
    image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?q=80&w=1400&auto=format&fit=crop",
  },
  Paris: {
    title: "Paris: The Eternal City of Light, Love, and Refined Living",
    intro: "Paris is a mood — a leisurely café au lait on a sun-dappled terrace, the soft glow of the Eiffel Tower at dusk, and the hushed reverence of galleries filled with masters. It is the art of living well, elevated to a cultural creed.",
    highlights: [
      { label: "Best Time to Visit", value: "April — June & September — October" },
      { label: "Top Experiences", value: "Louvre Museum, Seine river cruise, Montmartre stroll, patisserie-hopping" },
      { label: "Vibe", value: "Romantic, artistic, timeless" },
    ],
    tips: [
      "Visit the Louvre on Wednesday or Friday evenings when it stays open late and crowds thin out.",
      "Skip the long Eiffel Tower queue — book a picnic at Champ de Mars for the best view.",
      "Explore Le Marais for hidden courtyards, boutique shopping, and the best falafel in the city.",
    ],
    image: "https://images.unsplash.com/photo-1550340499-a6c60fc8287c?q=80&w=1400&auto=format&fit=crop",
  },
  "Sri Lanka": {
    title: "Sri Lanka: Teardrop of the Indian Ocean, Wrapped in Emerald and Gold",
    intro: "Sri Lanka is an island of breathtaking contrasts — misty tea plantations in the central highlands, ancient Buddhist temples carved into rock, wildlife safaris through untamed jungles, and palm-fringed beaches lapped by warm turquoise waters. It is a journey through layers of history, nature, and warm hospitality.",
    highlights: [
      { label: "Best Time to Visit", value: "December — March (west) & May — September (east)" },
      { label: "Top Experiences", value: "Sigiriya Rock Fortress, Ella train ride, Yala safari, Galle Fort walk" },
      { label: "Vibe", value: "Lush, spiritual, adventurous" },
    ],
    tips: [
      "Take the Kandy-to-Ella train for what many call the most beautiful railway journey on Earth.",
      "Visit Sigiriya at sunrise to beat the heat and the crowds.",
      "Try authentic rice and curry served on a banana leaf — the best meals are found in local homes.",
    ],
    image: "https://images.pexels.com/photos/36847091/pexels-photo-36847091.jpeg?auto=compress&cs=tinysrgb&w=1400",
  },
};

const Blog = () => {
  const { navigate, translate } = useAppContext();

  // Pick the requested destination article or fall back to Maldives.
  const params = new URLSearchParams(window.location.search);
  const destinationParam = params.get("destination");
  const destination = destinationParam && blogData[destinationParam]
    ? destinationParam
    : "Maldives";
  const data = blogData[destination];

  useEffect(() => {
    document.title = `${destination} — SmartStayX Travel Journal`;
  }, [destination]);

  const fallbackDestinations = Object.keys(blogData);

  return (
    <section className="luxury-shell relative isolate min-h-screen overflow-hidden pt-28 pb-16 md:pt-36 md:pb-20">
      {/* Blog hero image */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0"
        initial={{ scale: 1 }}
        animate={{ scale: 1.06 }}
        transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      >
        <img src={data.image} alt={destination} className="h-full w-full object-cover" />
      </motion.div>

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,17,31,0.20)_0%,rgba(7,17,31,0.65)_50%,rgba(7,17,31,0.95)_100%)]" />
      <div className="absolute inset-0 mesh-glow opacity-60" />

      {/* Article header and content */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="font-playfair text-[clamp(2.2rem,5vw,4rem)] leading-[1.05] tracking-[-0.03em] text-white max-w-3xl">
            {data.title}
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          className="mt-8 space-y-8"
        >
          {/* Intro text */}
          <p className="text-lg leading-relaxed text-white/80 md:text-xl">
            {data.intro}
          </p>

          {/* Article highlights */}
          <div className="luxury-card relative overflow-hidden p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(212,168,95,0.10),transparent_50%)]" />
            <div className="relative">
              <h2 className="font-playfair text-xl text-white mb-4">Highlights</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {data.highlights.map((item) => (
                  <div key={item.label} className="luxury-card-soft px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45 mb-1">{item.label}</p>
                    <p className="text-sm text-white/85 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Insider tips */}
          <div className="luxury-card relative overflow-hidden p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(212,168,95,0.08),transparent_50%)]" />
            <div className="relative">
              <h2 className="font-playfair text-xl text-white mb-4">Insider Tips</h2>
              <ul className="space-y-3">
                {data.tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-3 text-white/75">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D4A85F]/20 text-[0.6rem] text-[#F5D08A]">
                      {i + 1}
                    </span>
                    <span className="text-base leading-relaxed">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Destination switcher */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <span className="text-sm text-white/45 uppercase tracking-[0.18em]">Explore more:</span>
            {fallbackDestinations.filter((d) => d !== destination).map((d) => (
              <button
                key={d}
                onClick={() => navigate(`/blog?destination=${encodeURIComponent(d)}`)}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm text-white/70 transition-all hover:border-[#D4A85F]/40 hover:text-[#F5D08A] backdrop-blur-xl"
              >
                {d}
              </button>
            ))}
          </div>

          {/* Primary actions */}
          <div className="flex gap-4 pt-4">
            <Link to="/rooms" className="gold-button px-6 py-3.5 text-sm">
              <img src={assets.arrowIcon} alt="arrow" className="w-4" />
              Book a Stay
            </Link>
            <Link to="/" className="ghost-button px-6 py-3.5 text-sm font-semibold text-white/90">
              Back to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Blog;
