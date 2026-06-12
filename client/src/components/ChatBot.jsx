import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm SmartStayX Assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const botResponses = {
    booking: "To book a room, browse our available properties, select your dates, and click 'Book Now'. You'll need to be logged in to complete the booking.",
    cancel: "You can cancel your bookings from 'My Bookings' page up to 48 hours before check-in for a full refund.",
    payment: "We accept all major credit cards, debit cards, and online payment methods. Payments are processed securely.",
    rooms: "We offer various room types including Standard Rooms, Deluxe Rooms, and Premium Suites. Each comes with unique amenities.",
    amenities: "Our properties feature amenities like Free WiFi, Free Breakfast, Room Service, Pool Access, and more. Check individual property pages for specific details.",
    location: "You can search for rooms by city or location using our search feature on the homepage.",
    price: "Room prices vary based on location, room type, and season. Use our filter options to find properties within your budget.",
    owner: "Are you a hotel owner? Click 'Register as Hotel Owner' to list your properties and manage bookings.",
    contact: "For support, please visit our contact page or email us at support@smartstayX.com",
    experience: "Check out our 'Experience' page to discover amazing activities and adventures at your destination!",
    account: "You can manage your account settings, view bookings, and update your profile from your user dashboard.",

    about: "SmartStayX is a full-stack hotel booking and property management platform. It allows users to discover, compare, and book hotels, while hotel owners can list and manage their properties. The platform features an AI-powered trip planner, dynamic pricing, multi-currency/multi-language support, and a recommendation engine.",
    tech: "Tech stack: • Frontend: React 19 + Vite, Tailwind CSS, Framer Motion • Backend: Node.js + Express • Database: MongoDB (Mongoose) • Cache: Redis (ioredis) • Auth: Clerk • Payments: Stripe • Media: Cloudinary • AI: OpenAI API • Maps: Google Places API • Validation: Zod",
    features: "Key features: • Hotel & room browsing with filters • Secure booking with Stripe payments • Dynamic pricing (seasonal, weekend, length-of-stay, early-bird, last-minute, repeat-guest discounts) • AI trip planner & recommendations • Multi-currency (USD, EUR, GBP, AED, SGD, LKR) & multi-language (English, Arabic, Chinese, Tamil, Sinhala, etc.) support • Hotel owner dashboard • Distributed booking locks via Redis • Responsive design with Framer Motion animations",
    setup: "To run locally: 1. Clone the repo 2. Run `npm install` in both `Server/` and `client/` directories 3. Set up environment variables in `Server/.env` (MongoDB URI, Clerk keys, Stripe keys, Cloudinary keys, OpenAI key) 4. Start Redis server 5. Run `npm run dev` in `Server/` for the backend and `client/` for the frontend 6. The app runs on `localhost:5173` with the API on `localhost:3000`",
    structure: "Project structure: • `Server/` — Express API, MongoDB models, controllers, services, middleware, validators • `client/` — React frontend with Vite, components, pages, context, services, routes • Key directories: `Server/models/` (Mongoose schemas), `Server/controllers/` (route handlers), `Server/services/` (business logic), `client/src/pages/` (app pages), `client/src/components/` (reusable UI components)",
  };

  const getResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('book') || lowerMessage.includes('reserve')) {
      return botResponses.booking;
    } else if (lowerMessage.includes('cancel') || lowerMessage.includes('refund')) {
      return botResponses.cancel;
    } else if (lowerMessage.includes('pay') || lowerMessage.includes('payment') || lowerMessage.includes('card')) {
      return botResponses.payment;
    } else if (lowerMessage.includes('room') || lowerMessage.includes('property')) {
      return botResponses.rooms;
    } else if (lowerMessage.includes('amenities') || lowerMessage.includes('facility') || lowerMessage.includes('wifi')) {
      return botResponses.amenities;
    } else if (lowerMessage.includes('location') || lowerMessage.includes('city') || lowerMessage.includes('where')) {
      return botResponses.location;
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('rate')) {
      return botResponses.price;
    } else if (lowerMessage.includes('owner') || lowerMessage.includes('register')) {
      return botResponses.owner;
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return botResponses.contact;
    } else if (lowerMessage.includes('experience') || lowerMessage.includes('activity') || lowerMessage.includes('adventure')) {
      return botResponses.experience;
    } else if (lowerMessage.includes('account') || lowerMessage.includes('profile')) {
      return botResponses.account;
    } else if (lowerMessage.includes('about') || lowerMessage.includes('what is') || lowerMessage.includes('this project') || lowerMessage.includes('tell me about')) {
      return botResponses.about;
    } else if (lowerMessage.includes('tech') || lowerMessage.includes('stack') || lowerMessage.includes('technology') || lowerMessage.includes('built with') || lowerMessage.includes('framework')) {
      return botResponses.tech;
    } else if (lowerMessage.includes('feature') || lowerMessage.includes('what can') || lowerMessage.includes('capabilities') || lowerMessage.includes('functionality')) {
      return botResponses.features;
    } else if (lowerMessage.includes('setup') || lowerMessage.includes('install') || lowerMessage.includes('run') || lowerMessage.includes('local') || lowerMessage.includes('deploy') || lowerMessage.includes('start')) {
      return botResponses.setup;
    } else if (lowerMessage.includes('structure') || lowerMessage.includes('folder') || lowerMessage.includes('architecture') || lowerMessage.includes('organized') || lowerMessage.includes('directory')) {
      return botResponses.structure;
    } else {
      return "I can help with booking, payments, cancellations, amenities, pricing, hotel owner registration, and project info. Ask me about the tech stack, features, setup guide, or project structure!";
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getResponse(inputValue),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsLoading(false);
    }, 500);
  };

  const quickQuestions = [
    'How to book a room?',
    'What is this project?',
    'What tech stack is used?',
    'Tell me about the features',
    'How to run locally?',
    'What is the project structure?',
  ];

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="bg-[#0d1728] rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col mb-4 overflow-hidden border border-white/10">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0d1728] to-[#07111f] p-4 flex items-center justify-between border-b border-white/10">
            <div>
              <h3 className="font-semibold text-white text-lg">SmartStayX Assistant</h3>
              <p className="text-xs text-white/40">Always here to help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white transition rounded-full p-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#07111f]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2.5 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-[#D4A85F] text-[#07111f] rounded-br-sm'
                      : 'bg-white/5 text-white/80 rounded-bl-sm border border-white/5'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 text-white px-4 py-3 rounded-2xl rounded-bl-sm border border-white/5">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 bg-[#D4A85F] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#D4A85F] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <div className="w-2 h-2 bg-[#D4A85F] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-3 bg-[#0d1728] border-t border-white/10">
              <p className="text-xs text-white/40 mb-2">Quick questions:</p>
              <div className="space-y-1.5">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full text-left text-xs px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition border border-white/5"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="border-t border-white/10 p-3 bg-[#0d1728]">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-[#D4A85F]/50 transition"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-[#D4A85F] hover:bg-[#c49a4e] text-[#07111f] px-4 py-2 rounded-xl transition disabled:opacity-50 text-sm font-medium"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition transform hover:scale-110 ${
          isOpen
            ? 'bg-red-500 hover:bg-red-600 text-white'
            : 'bg-[#D4A85F] hover:bg-[#c49a4e] text-[#07111f]'
        }`}
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
