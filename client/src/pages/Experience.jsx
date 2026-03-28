import React from 'react';
import { assets } from '../assets/assets';

const Experience = () => {
  return (
    <div className="py-28 px-6 md:px-16 lg:px-24 xl:px-32">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
        <div className="col-span-2">
          <h1 className="text-4xl font-bold mb-4">Unveiling Elegance, Embracing Tranquility</h1>
          <p className="text-gray-600 mb-6">
            Discover a curated experience designed to delight your senses and restore your spirit. Our portfolio of boutique hotels blends warm hospitality with refined details to create unforgettable stays.
          </p>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
            <p className="text-gray-600">To deliver exceptional guest experiences through thoughtful design, attentive service, and locally inspired hospitality.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Elevated Comfort</h2>
            <p className="text-gray-600">We select properties that prioritise comfort, aesthetics and a restful atmosphere — from plush bedding to serene public spaces.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Culinary Delights</h2>
            <p className="text-gray-600">Our partner restaurants and in-house chefs craft seasonal menus celebrating local produce and global inspiration.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Commitment</h2>
            <p className="text-gray-600">We are committed to sustainability, respectful tourism, and community partnerships that uplift local businesses.</p>
          </section>
        </div>

        <aside className="bg-white shadow p-6 rounded-lg">
          <img src={assets.regImage} alt="Experience" className="w-full h-48 object-cover rounded mb-4" />

          <div className="mb-4">
            <h3 className="text-lg font-semibold">Contact Us</h3>
            <p className="text-sm text-gray-600">Email: hello@smartstayx.example</p>
            <p className="text-sm text-gray-600">Phone: +1 (555) 123-4567</p>
          </div>

          <div>
            <h3 className="text-lg font-semibold">Boutique Bliss</h3>
            <p className="text-sm text-gray-600">Experience handpicked retreats crafted for the discerning traveller.</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Experience;
