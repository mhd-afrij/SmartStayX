import { useEffect, useRef } from 'react';
import { MessageCircle, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useChatContext } from '../../context/ChatContext';
import { useAppContext } from '../../context/AppContext';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

const ChatBotPage = () => {
  const {
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
    deleteConversation,
  } = useChatContext();

  const { navigate } = useAppContext();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
    <div className="min-h-screen bg-black">
      <div className="mx-auto flex max-w-6xl flex-col lg:flex-row" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Sidebar */}
        <div className="w-full border-b border-white/10 bg-white/[0.02] lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/')}
                className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h2 className="font-semibold text-white">Conversations</h2>
            </div>
            <button
              onClick={startNewChat}
              className="flex items-center gap-1.5 rounded-lg bg-[#D4A855] px-3 py-1.5 text-sm font-medium text-black transition-colors hover:bg-[#c49a3e]"
            >
              <Plus className="h-4 w-4" />
              New
            </button>
          </div>

          <div className="overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
            {conversations.length === 0 && (
              <p className="px-4 py-8 text-center text-sm text-white/30">No conversations yet</p>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex items-center justify-between border-b border-white/5 px-4 py-3 transition-colors cursor-pointer ${
                  activeConversationId === conv.id
                    ? 'bg-[#D4A855]/10'
                    : 'hover:bg-white/5'
                }`}
                onClick={() => loadConversation(conv.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/80">
                    {conv.title || 'New conversation'}
                  </p>
                  {conv.preview && (
                    <p className="mt-0.5 truncate text-xs text-white/40">{conv.preview}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="ml-2 shrink-0 rounded-lg p-1.5 text-white/20 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#D4A855]/20">
              <MessageCircle className="h-5 w-5 text-[#D4A855]" />
            </div>
            <div>
              <p className="font-semibold text-white">SmartStayX Concierge</p>
              <p className="text-xs text-white/40">AI-powered hotel & travel assistant</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-thin scrollbar-thumb-white/10">
            {messages.length === 0 && !isLoading && (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#D4A855]/10">
                  <MessageCircle className="h-10 w-10 text-[#D4A855]" />
                </div>
                <h2 className="text-2xl font-semibold text-white">How can I help you?</h2>
                <p className="mt-2 text-white/50 max-w-md">
                  Ask about hotels, check your bookings, plan a trip, or request services — I'm here to assist with everything.
                </p>
              </div>
            )}

            <div className="mx-auto max-w-3xl space-y-6">
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
                <div className="rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-white/10 bg-black/40">
            <div className="mx-auto max-w-3xl">
              <ChatInput
                onSend={handleSend}
                isLoading={isLoading}
                onSuggestionClick={handleSuggestion}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotPage;
