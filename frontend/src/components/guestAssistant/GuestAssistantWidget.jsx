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

  const appendAssistantToken = (token) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant' && last.streaming) {
        next[next.length - 1] = { ...last, text: (last.text || '') + token };
      }
      return next;
    });
  };

  const streamReply = async ({ content, languageName, headers }) => {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || '';
    const response = await fetch(`${baseUrl}${API_ENDPOINTS.guestAssistant.chatStream}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify({
        message: content,
        conversationId,
        language: selectedLanguage || null,
        languageName,
      }),
    });
    if (!response.ok || !response.body) throw new Error('Stream unavailable');

    setMessages((prev) => [...prev, { role: 'assistant', text: '', streaming: true }]);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let replyConversationId = null;
    let received = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split('\n\n');
      buffer = frames.pop() || '';
      for (const frame of frames) {
        let event = 'message';
        let data = '';
        for (const line of frame.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) data += line.slice(5).trim();
        }
        if (!data) continue;
        let payload;
        try {
          payload = JSON.parse(data);
        } catch {
          continue;
        }
        if (event === 'token' && payload.token) {
          received = true;
          appendAssistantToken(payload.token);
        } else if (event === 'done') {
          replyConversationId = payload.conversationId || replyConversationId;
        }
      }
    }

    if (!received) throw new Error('Empty stream');

    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (last?.role === 'assistant') next[next.length - 1] = { ...last, streaming: false };
      return next;
    });
    if (replyConversationId) setConversationId(replyConversationId);
  };

  const jsonReply = async ({ content, languageName, headers }) => {
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
  };

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

      try {
        await streamReply({ content, languageName, headers });
      } catch {
        setMessages((prev) =>
          prev[prev.length - 1]?.role === 'assistant' && prev[prev.length - 1].streaming
            ? prev.slice(0, -1)
            : prev
        );
        await jsonReply({ content, languageName, headers });
      }
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
            className="mb-3 w-[min(92vw,380px)] overflow-hidden rounded-3xl border border-black/[0.06] dark:border-[#1D3842] bg-white dark:bg-[#122A32] shadow-[0_20px_60px_rgba(0,56,68,0.14)]"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-[#1D3842] px-4 py-3">
              <div>
                <div className="flex items-center gap-2 text-[#5077B3] dark:text-[#93B3E0]">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Guest Assistant</span>
                </div>
                <p className="mt-1 text-xs text-slate-400 dark:text-[#6B828A]">Booking help, rooms, payments, and support</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMinimized(true)}
                  aria-label="Minimize guest assistant"
                  className="rounded-full border border-black/[0.06] dark:border-[#1D3842] p-2 text-slate-500 dark:text-[#8299A0] hover:text-slate-900 dark:hover:text-[#E9F1F2]"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => { setOpen(false); setMinimized(false); }}
                  aria-label="Close guest assistant"
                  className="rounded-full border border-black/[0.06] dark:border-[#1D3842] p-2 text-slate-500 dark:text-[#8299A0] hover:text-slate-900 dark:hover:text-[#E9F1F2]"
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
                        ? 'bg-[#5077B3] text-white'
                        : 'bg-[#f4f2ef] dark:bg-[#16303A] text-slate-700 dark:text-[#C1D2D6]'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              {loading && !messages[messages.length - 1]?.streaming && (
                <div className="flex justify-start">
                  <div className="rounded-2xl bg-[#f4f2ef] dark:bg-[#16303A] px-3 py-2 text-sm text-slate-400 dark:text-[#6B828A]">
                    Typing...
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-black/[0.06] dark:border-[#1D3842] px-4 py-3">
              <SuggestionChips onSelect={sendMessage} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              className="flex items-center gap-2 border-t border-black/[0.06] dark:border-[#1D3842] px-4 py-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about booking..."
                className="h-11 flex-1 rounded-2xl border border-black/[0.08] dark:border-[#1D3842] bg-white dark:bg-[#122A32] px-3 text-sm text-slate-900 dark:text-[#E9F1F2] outline-none placeholder:text-slate-400 dark:placeholder:text-[#6B828A]"
              />
              <button
                type="submit"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5077B3] text-white transition-transform hover:scale-[1.02]"
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
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#5077B3] text-white shadow-[0_18px_40px_rgba(80, 119, 179,0.3)] transition-transform hover:scale-105"
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
