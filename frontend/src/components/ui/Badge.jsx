const TONES = {
  success: 'bg-green-50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/25',
  confirmed: 'bg-[#EFEDF7] dark:bg-[#1B2436] text-[#B58A2E] dark:text-[#E6C075] border-[#B9B4CE]/45 dark:border-[#3D4660]/45',
  pending: 'bg-[#F4F2F9] dark:bg-[#1B2436] text-amber-700 dark:text-amber-300 border-[#B9B4CE]/45 dark:border-[#3D4660]/45',
  progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  checkedIn: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-green-50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-500/25',
  cancelled: 'bg-red-50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-500/25',
  expired: 'bg-slate-100 dark:bg-[#10131D] text-slate-500 dark:text-[#8299A0] border-slate-200 dark:border-[#232737]',
  maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
  cleaning: 'bg-purple-50 text-purple-700 border-purple-200',
  refunded: 'bg-teal-50 text-teal-700 border-teal-200',
  neutral: 'bg-slate-100 dark:bg-[#10131D] text-slate-600 dark:text-[#9FB2B8] border-slate-200 dark:border-[#232737]',
};

const Badge = ({ tone = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone] || TONES.neutral} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
