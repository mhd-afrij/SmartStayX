import React from 'react';
import { assets } from '../assets/assets';

const About = () => {
  return (
    <div className="py-28 px-6 md:px-16 lg:px-24 xl:px-32">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl font-bold mb-4">About SmartStayX</h1>
          <p className="text-gray-600 mb-4">
            SmartStayX curates exceptional stays with a focus on design, service, and local discovery.
            We partner with independent boutique hotels to deliver personalized experiences for every traveler.
          </p>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
            <p className="text-gray-600">To create memorable journeys by connecting guests with thoughtful properties and genuine hospitality.</p>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">What We Value</h2>
            <ul className="list-disc ml-5 text-gray-600">
              <li>Authenticity and local experiences</li>
              <li>Sustainable and responsible travel</li>
              <li>Warm, attentive service</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-2xl font-semibold mb-2">Our Team</h2>
            <p className="text-gray-600">A small team of hospitality enthusiasts, designers, and technologists working to simplify how you discover and book boutique stays.</p>
          </section>
        </div>

        <aside className="bg-white shadow p-6 rounded-lg">
          <img src={assets.regImage} alt="About" className="w-full h-56 object-cover rounded mb-4" />
          <div>
            <h3 className="text-lg font-semibold">Contact</h3>
            <p className="text-sm text-gray-600">Email: hello@smartstayx.example</p>
            <p className="text-sm text-gray-600">Phone: +1 (555) 123-4567</p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default About;
