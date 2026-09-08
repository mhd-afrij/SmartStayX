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
          className="flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-[#1D3842] bg-white dark:bg-[#122A32] px-3 py-1.5 text-xs text-slate-600 dark:text-[#9FB2B8] transition-all hover:border-[#5077B3]/30 hover:bg-[#5077B3]/10 hover:text-[#5077B3] dark:hover:text-[#93B3E0]"
        >
          <Icon className="h-3 w-3" />
          {text}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
