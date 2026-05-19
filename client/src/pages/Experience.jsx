import React from 'react';
import { motion } from 'framer-motion';
import { assets } from '../assets/assets';
import Title from '../components/Title';

const Experience = () => {
  const highlights = [
    { title: 'Our Mission', text: 'To deliver exceptional guest experiences through thoughtful design, attentive service, and locally inspired hospitality.' },
    { title: 'Elevated Comfort', text: 'We select properties that prioritise comfort, aesthetics and a restful atmosphere — from plush bedding to serene public spaces.' },
    { title: 'Culinary Delights', text: 'Our partner restaurants and in-house chefs craft seasonal menus celebrating local produce and global inspiration.' },
    { title: 'Commitment', text: 'We are committed to sustainability, respectful tourism, and community partnerships that uplift local businesses.' },
  ];

  return (
    <div className="min-h-screen bg-[#07111f]">
      <section className="luxury-section pt-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-8">
              <Title
                align="left"
                kicker="The SmartStayX Experience"
                title="Unveiling Elegance, Embracing Tranquility"
                subtitle="Discover a curated experience designed to delight your senses and restore your spirit. Our portfolio of boutique hotels blends warm hospitality with refined details to create unforgettable stays."
              />

              <div className="grid gap-5 md:grid-cols-2">
                {highlights.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.06 }}
                    className="luxury-card-soft p-6"
                  >
                    <p className="font-space text-xs uppercase tracking-[0.24em] text-[#D4A85F] mb-3">{String(index + 1).padStart(2, '0')}</p>
                    <h3 className="font-playfair text-xl text-white mb-3">{item.title}</h3>
                    <p className="text-sm text-white/60 leading-relaxed">{item.text}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <aside className="lg:pt-16">
              <div className="luxury-card overflow-hidden p-5 md:p-6 space-y-6">
                <img src={assets.regImage} alt="Experience" className="w-full h-48 object-cover rounded-2xl" />

                <div>
                  <p className="font-space text-xs uppercase tracking-[0.24em] text-white/50 mb-3">Contact Us</p>
                  <p className="text-sm text-white/70">Email: hello@smartstayx.com</p>
                  <p className="text-sm text-white/70">Phone: +1 (555) 123-4567</p>
                </div>

                <div className="luxury-divider" />

                <div>
                  <p className="font-space text-xs uppercase tracking-[0.24em] text-white/50 mb-3">Boutique Bliss</p>
                  <p className="text-sm text-white/60">Experience handpicked retreats crafted for the discerning traveller.</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Experience;
