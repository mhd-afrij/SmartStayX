import { Bot, User } from 'lucide-react';

const ChatMessage = ({ message, isStreaming }) => {
  const isUser = message.role === 'user';
  const content = message.content || '';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-[#2563EB]' : 'bg-[#f4f2ef]'
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-white" />
        ) : (
          <Bot className="h-4 w-4 text-[#2563EB]" />
        )}
      </div>

      <div className={`max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-[#2563EB] text-white'
              : 'bg-[#f4f2ef] text-slate-700'
          }`}
        >
          {content || (isStreaming ? '' : '...')}
          {isStreaming && (
            <span className="inline-block w-1.5 h-4 ml-1 bg-[#2563EB] animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
