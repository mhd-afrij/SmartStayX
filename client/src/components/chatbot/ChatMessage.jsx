import { Bot, User } from 'lucide-react';

const ChatMessage = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const content = message.content || '';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-[#D4A855]' : 'bg-white/10'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-black" />
        ) : (
          <Bot className="h-4 w-4 text-[#D4A855]" />
        )}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#D4A855]/20 text-white'
              : 'bg-white/5 text-white/90'
          }`}
        >
          {content || (isStreaming ? '' : '...')}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-[#D4A855] animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
