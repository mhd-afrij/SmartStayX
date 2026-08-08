export const Card = ({ className = '', children, padded = true, ...props }) => (
  <div
    className={`rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.06)] ${padded ? 'p-6' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, trend, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'bg-[#2563EB]/10 text-[#2563EB]',
    gold: 'bg-[#D4A853]/15 text-[#92660f]',
    success: 'bg-green-50 text-green-700',
    danger: 'bg-red-50 text-red-700',
  };
  return (
    <Card className="flex items-center gap-4">
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone] || toneClasses.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-xl font-semibold text-[#0F172A] truncate">{value}</p>
          {trend != null && (
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Card;
