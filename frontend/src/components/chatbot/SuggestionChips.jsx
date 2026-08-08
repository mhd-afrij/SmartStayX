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
          className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs text-slate-600 transition-all hover:border-[#2563EB]/30 hover:bg-[#2563EB]/10 hover:text-[#2563EB]"
        >
          <Icon className="h-3 w-3" />
          {text}
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;
