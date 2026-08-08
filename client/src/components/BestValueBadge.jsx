import { Zap } from 'lucide-react'

const BestValueBadge = ({ score, savingsPercent, size = 'sm' }) => {
  const isGreatValue = score >= 80 || savingsPercent >= 15;
  const isGoodValue = score >= 60 || savingsPercent >= 5;

  if (!isGreatValue && !isGoodValue) return null;

  const sizeClasses = size === 'lg'
    ? 'px-3 py-1.5 text-xs'
    : 'px-2 py-1 text-[10px]';

  const label = savingsPercent >= 15
    ? `Save ${savingsPercent}%`
    : score >= 80
    ? `Great Value — ${score}`
    : `Good Value — ${score}`;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold uppercase tracking-wider rounded-full ${
        savingsPercent >= 15
          ? 'bg-green-500/20 text-green-300 border border-green-500/30'
          : 'bg-[#D4A85F]/15 text-[#F5D08A] border border-[#D4A85F]/30'
      } ${sizeClasses}`}
    >
      <Zap className="w-3 h-3" />
      {label}
    </span>
  );
};

export default BestValueBadge;
