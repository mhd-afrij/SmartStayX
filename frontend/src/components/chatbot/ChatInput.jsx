import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import SuggestionChips from './SuggestionChips';

const ChatInput = ({ onSend, isLoading, onSuggestionClick }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!isLoading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestion = (text) => {
    onSuggestionClick(text);
  };

  return (
    <div className="border-t border-black/[0.06] bg-white px-4 py-3">
      {!isLoading && <SuggestionChips onSelect={handleSuggestion} />}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
        <div className="relative flex-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none rounded-xl border border-black/[0.08] bg-white px-4 py-3 pr-12 text-sm text-slate-900 placeholder-slate-400 outline-none transition-colors focus:border-[#2563EB]/50 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-white transition-all hover:brightness-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
          <Sparkles className="h-3 w-3 animate-pulse text-[#2563EB]" />
          <span>AI is thinking...</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
