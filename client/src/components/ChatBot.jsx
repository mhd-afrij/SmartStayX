import React, { useState, useRef, useEffect } from 'react';

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! 👋 I'm SmartStayX Assistant. How can I help you today?",
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
  };

  const getResponse = (userMessage) => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for keywords
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
    } else if (lowerMessage.includes('owner') || lowerMessage.includes('hotel') || lowerMessage.includes('register')) {
      return botResponses.owner;
    } else if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help')) {
      return botResponses.contact;
    } else if (lowerMessage.includes('experience') || lowerMessage.includes('activity') || lowerMessage.includes('adventure')) {
      return botResponses.experience;
    } else if (lowerMessage.includes('account') || lowerMessage.includes('profile') || lowerMessage.includes('booking')) {
      return botResponses.account;
    } else {
      return "I'm here to help! You can ask me about booking rooms, cancellations, payments, amenities, locations, prices, hotel registration, or anything else about SmartStayX. What would you like to know?";
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate bot response delay
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
    'Can I cancel my booking?',
    'What are the amenities?',
    'I want to register as a hotel owner',
  ];

  const handleQuickQuestion = (question) => {
    setInputValue(question);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-xl shadow-2xl w-96 h-[500px] flex flex-col mb-4 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">SmartStayX Assistant</h3>
              <p className="text-xs text-blue-100">Always here to help</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-800 rounded-full p-1 transition"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-800 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 bg-white border-t border-gray-200">
              <p className="text-xs text-gray-600 mb-2">Quick questions:</p>
              <div className="space-y-2">
                {quickQuestions.map((question, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickQuestion(question)}
                    className="w-full text-left text-xs px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="border-t border-gray-200 p-3 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition disabled:opacity-50 text-sm font-medium"
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
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {isOpen ? (
          <span className="text-xl">✕</span>
        ) : (
          <span className="text-xl">💬</span>
        )}
      </button>
    </div>
  );
};

export default ChatBot;
