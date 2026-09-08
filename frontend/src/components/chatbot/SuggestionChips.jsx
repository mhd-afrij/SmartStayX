import { Sparkles, Calendar, Compass, Building2 } from 'lucide-react';

const SUGGESTIONS = [
  { icon: Sparkles, text: 'Show my bookings' },
  { icon: Building2, text: 'Find hotels in Paris' },
  { icon: Calendar, text: 'Plan a weekend trip' },
  { icon: Compass, text: 'Nearby attractions' },
];

const SuggestionChips = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {SUGGESTIONS.map(({ icon: Icon, text }) => (
        <button
          key={text}
          onClick={() => onSelect(text)}
          className="flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] px-3 py-1.5 text-xs text-slate-600 dark:text-[#A9AEA7] transition-all hover:border-[#183B35]/30 hover:bg-[#183B35]/10 hover:text-[#183B35] dark:hover:text-[#8FB8A8]"
        >
          <Icon className="h-3 w-3" />
          {text}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
