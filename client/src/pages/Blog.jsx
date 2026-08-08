/**
 * Blog — Travel insights page displaying destination‑filterable articles
 * with a full‑width hero, highlight grid, and curated sections.
 */
import React, { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'

/** Static travel content per destination */
const blogData = {
  Maldives: {
    title: 'Maldives: Where Waters Whisper and Luxury Lives on the Tide',
    intro:
      'Imagine waking up to the gentle lap of turquoise waters beneath your overwater villa, the sun casting golden ribbons across an endless horizon. The Maldives is not just a destination — it is a feeling of weightlessness, of being suspended between sky and sea.',
    highlights: [
      { label: 'Best Time to Visit', value: 'November — April' },
      { label: 'Top Experiences', value: 'Overwater dining, sunset cruises, manta ray snorkeling' },
    ],
  },
  Switzerland: {
    title: 'Switzerland: Alpine Grandeur Meets Refined Hospitality',
    intro:
      'There is a reason Switzerland has inspired poets, painters, and pilgrims for centuries. Its peaks cut the sky with a kind of quiet majesty, and its valleys hold villages where time seems to slow. Here, luxury is not about excess — it is about precision, serenity, and the texture of the moment.',
    highlights: [
      { label: 'Best Time to Visit', value: 'June — August / December — March' },
      { label: 'Top Experiences', value: 'Glacier Express, Zermatt skiing, Lucerne lakeside stays' },
    ],
  },
  'Sri Lanka': {
    title: 'Sri Lanka: An Island of Ancient Trails, Spice-Scented Air, and Untamed Shores',
    intro:
      'Sri Lanka is a land of contrasts — misty tea country rolling into golden plains, ancient temples standing watch over bustling market towns, and the Indian Ocean lapping at shores that have welcomed traders for millennia. It is intimate, raw, and endlessly surprising.',
    highlights: [
      { label: 'Best Time to Visit', value: 'December — March (west/south) / May — September (east)' },
      { label: 'Top Experiences', value: 'Sigiriya sunrise, Yala safari, Galle Fort walks' },
    ],
  },
  'United Arab Emirates': {
    title: 'United Arab Emirates: Where Vision Shapes the Skyline',
    intro:
      'The UAE is a canvas of ambition — futuristic cities rising from the desert, artificial islands shaped like atlas dreams, and a hospitality scene that redefines excess. Yet beyond the glitter lie quiet dunes, ancient souks, and a culture of deep generosity.',
    highlights: [
      { label: 'Best Time to Visit', value: 'November — March' },
      { label: 'Top Experiences', value: "Burj Khalifa, desert safari, Sheikh Zayed Grand Mosque" },
    ],
  },
  Japan: {
    title: 'Japan: The Art of Impermanence and the Rhythm of Refinement',
    intro:
      'Japan moves to its own rhythm — a harmony of ancient temples and neon-lit streets, of tea ceremonies and bullet trains. Every detail, from the moss in a Kyoto garden to the steam rising from a bowl of ramen, is deliberate. Luxury here is quiet, respectful, and deeply sensory.',
    highlights: [
      { label: 'Best Time to Visit', value: 'March — May / October — November' },
      { label: 'Top Experiences', value: 'Cherry blossom season, Kyoto temple stays, onsens in Hakone' },
    ],
  },
  Singapore: {
    title: 'Singapore: A Garden City That Never Stops Blooming',
    intro:
      'Singapore is a microcosm of Asia — Chinese shophouses, Malay kampongs, Indian spice trails, and futuristic glass all coexist on one small island. It is clean, green, and gloriously efficient. Here, luxury is found in the seamless blend of cultures, cuisines, and cutting-edge design.',
    highlights: [
      { label: 'Best Time to Visit', value: 'February — April' },
      { label: 'Top Experiences', value: 'Marina Bay Sands, Gardens by the Bay, hawker center tours' },
    ],
  },
}

const Blog = () => {
  const { location } = useAppContext()
  const queryParams = new URLSearchParams(location.search)
  const destination = queryParams.get('destination')
  const data = destination && blogData[destination]

  useEffect(() => {
    document.title = `SmartStayX — ${data?.title || 'Travel Blog'}`
    window.scrollTo(0, 0)
  }, [data])

  if (!data) {
    return (
      <section className="luxury-section min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="font-playfair text-4xl text-white">Destination not found</h1>
          <p className="text-white/60">The travel guide you are looking for does not exist yet.</p>
          <Link to="/" className="gold-button inline-flex px-6 py-3 text-sm">
            Back to Home
            <ArrowRight className="w-4" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="pt-28 pb-16 md:pt-32 md:pb-20">
      <div className="mx-auto max-w-5xl px-6 md:px-10 space-y-12">
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-playfair text-4xl md:text-6xl text-white leading-tight">
            {data.title}
          </h1>
          <p className="mt-6 text-lg text-white/70 leading-relaxed">{data.intro}</p>
        </motion.div>

        {/* Highlights grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {data.highlights.map((item) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="luxury-card p-6"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                {item.label}
              </p>
              <p className="mt-2 font-playfair text-xl text-white">{item.value}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Blog
