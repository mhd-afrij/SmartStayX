import { useEffect, useRef } from 'react';
import { MessageCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatContext } from '../../context/ChatContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatBotWidget = () => {
  const {
    isOpen,
    toggleOpen,
    messages,
    isLoading,
    streamingContent,
    conversations,
    activeConversationId,
    error,
    sendMessage,
    loadConversations,
    loadConversation,
    startNewChat,
  } = useChatContext();

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadConversations();
    }
  }, [isOpen, loadConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = async (content) => {
    await sendMessage(content);
  };

  const handleSuggestion = (text) => {
    handleSend(text);
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#D4A855] text-black shadow-lg shadow-[#D4A855]/20 transition-all hover:bg-[#c49a3e] hover:scale-105 active:scale-95"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl shadow-black/50 backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D4A855]/20">
                  <MessageCircle className="h-4 w-4 text-[#D4A855]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">SmartStayX Concierge</p>
                  <p className="text-xs text-white/40">AI-powered assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={startNewChat}
                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                  title="New conversation"
                >
                  <MessageCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleOpen}
                  className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Conversations sidebar toggle */}
            {conversations.length > 0 && (
              <div className="flex gap-1 overflow-x-auto border-b border-white/5 bg-white/[0.02] px-3 py-2 scrollbar-hide">
                {conversations.slice(0, 5).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => loadConversation(conv.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs transition-colors ${
                      activeConversationId === conv.id
                        ? 'bg-[#D4A855]/20 text-[#D4A855]'
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70'
                    }`}
                  >
                    {conv.title.slice(0, 20)}
                  </button>
                ))}
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-white/10">
              {messages.length === 0 && !isLoading && (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#D4A855]/10">
                    <MessageCircle className="h-8 w-8 text-[#D4A855]" />
                  </div>
                  <p className="text-lg font-semibold text-white">How can I help you?</p>
                  <p className="mt-1 text-sm text-white/50">
                    Ask about hotels, bookings, or plan your trip
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <ChatMessage key={idx} message={msg} />
                ))}

                {streamingContent && (
                  <ChatMessage
                    message={{ role: 'assistant', content: streamingContent }}
                    isStreaming
                  />
                )}

                {error && (
                  <div className="rounded-lg bg-red-500/10 px-4 py-2 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <ChatInput
              onSend={handleSend}
              isLoading={isLoading}
              onSuggestionClick={handleSuggestion}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBotWidget;
