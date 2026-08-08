const TONES = {
  success: 'bg-green-50 text-green-700 border-green-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  progress: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  checkedIn: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  expired: 'bg-slate-100 text-slate-500 border-slate-200',
  maintenance: 'bg-orange-50 text-orange-700 border-orange-200',
  cleaning: 'bg-purple-50 text-purple-700 border-purple-200',
  refunded: 'bg-teal-50 text-teal-700 border-teal-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

const Badge = ({ tone = 'neutral', children, className = '' }) => (
  <span
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${TONES[tone] || TONES.neutral} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
