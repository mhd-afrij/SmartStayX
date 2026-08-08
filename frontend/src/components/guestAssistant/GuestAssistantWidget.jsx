import React, { useState } from 'react';
import { MessageCircle, Send, X, Sparkles, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API_ENDPOINTS from '../../config/endpoints';
import { useAppContext } from '../../context/AppContext';
import SuggestionChips from '../chatbot/SuggestionChips';

const GuestAssistantWidget = () => {
  const { axios, getToken, selectedLanguage, languageOptions } = useAppContext();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi, I can help you book a stay, check rooms, or explain payment steps.' },
  ]);

  const sendMessage = async (text) => {
    const content = text.trim();
    if (!content || loading) return;

    setMessages((prev) => [...prev, { role: 'user', text: content }]);
    setInput('');
    setLoading(true);

    try {
      // Attach the Clerk session token when signed in so the concierge can
      // personalise replies (bookings, preferences). Guests stay anonymous.
      let headers = {};
      try {
        const token = await getToken?.();
        if (token) headers.Authorization = `Bearer ${token}`;
      } catch {
        // Not signed in — continue anonymously.
      }

      const languageName =
        languageOptions?.find((opt) => opt.code === selectedLanguage)?.label || null;

      const { data } = await axios.post(
        API_ENDPOINTS.guestAssistant.chat,
        {
          message: content,
          conversationId,
          language: selectedLanguage || null,
          languageName,
        },
        { headers }
      );

      const reply = data?.data?.reply;
      if (!reply || !reply.message) {
        throw new Error(data?.message || 'Assistant unavailable');
      }

      if (reply.conversationId) setConversationId(reply.conversationId);

      const answerLines = [reply.message, ...(reply.suggestions || [])].filter(Boolean);
      setMessages((prev) => [...prev, { role: 'assistant', text: answerLines.join(' ') }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'I could not reach the booking assistant right now. Please try the Rooms or Support page.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      <AnimatePresence>
        {open && !minimized && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="mb-3 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-black/[0.06] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.14)]"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-[#2563EB]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Guest Assistant</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">Booking help, rooms, payments, and support</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMinimized(true)}
                  aria-label="Minimize guest assistant"
                  className="rounded-full border border-black/[0.06] p-2 text-slate-500 hover:text-slate-900"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setOpen(false); setMinimized(false); }}
                  aria-label="Close guest assistant"
                  className="rounded-full border border-black/[0.06] p-2 text-slate-500 hover:text-slate-900"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[320px] space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                      message.role === 'user'
                        ? 'bg-[#2563EB] text-white'
                        : 'bg-[#f4f2ef] text-slate-700'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-[#f4f2ef] px-3 py-2 text-sm text-slate-400">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-black/[0.06] px-4 py-3">
              <SuggestionChips onSelect={sendMessage} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 border-t border-black/[0.06] px-4 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about booking..."
                className="h-11 flex-1 rounded-2xl border border-black/[0.08] bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#2563EB] text-white transition-transform hover:scale-[1.02]"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          if (open && minimized) {
            setMinimized(false);
          } else {
            setOpen((v) => !v);
            setMinimized(false);
          }
        }}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-[0_18px_40px_rgba(37, 99, 235,0.3)] transition-transform hover:scale-105"
        aria-label={open && minimized ? 'Restore guest assistant' : 'Open guest assistant'}
      >
        <MessageCircle className="h-6 w-6" />
        {open && minimized && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-[#D4A853] border-2 border-white" />
        )}
      </button>
    </div>
  );
};

export default GuestAssistantWidget;
