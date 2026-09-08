export const Card = ({ className = '', children, padded = true, ...props }) => (
  <div
    className={`rounded-2xl border border-[#E3E0D8] dark:border-[#303631] bg-white dark:bg-[#1A1E1B] shadow-[0_1px_2px_rgba(24,59,53,0.06)] ${padded ? 'p-6' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, trend, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'bg-[#A67C52]/10 text-[#8A643F] dark:text-[#C5A47E]',
    gold: 'bg-[#A67C52]/15 text-[#8A643F] dark:text-[#C5A47E]',
    success: 'bg-green-50 text-green-700 dark:text-green-300',
    danger: 'bg-red-50 text-red-700 dark:text-red-300',
  };
  return (
    <Card className="flex items-center gap-4">
      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${toneClasses[tone] || toneClasses.primary}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#5C6B64] dark:text-[#A9AEA7] uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-xl font-semibold text-[#183B35] dark:text-[#F2EFE8] truncate">{value}</p>
          {trend != null && (
            <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-600 dark:text-green-300' : 'text-red-600 dark:text-red-300'}`}>
              {trend >= 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};

export default Card;
