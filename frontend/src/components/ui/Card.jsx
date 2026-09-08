export const Card = ({ className = '', children, padded = true, ...props }) => (
  <div
    className={`rounded-2xl border border-[#E8E0D1] dark:border-[#232737] bg-white dark:bg-[#161925] shadow-[0_1px_2px_rgba(0,56,68,0.06)] ${padded ? 'p-6' : ''} ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const StatCard = ({ label, value, icon: Icon, trend, tone = 'primary' }) => {
  const toneClasses = {
    primary: 'bg-[#D4A853]/10 text-[#B58A2E] dark:text-[#E6C075]',
    gold: 'bg-[#D4A853]/15 text-[#92660f] dark:text-[#E6C075]',
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
        <p className="text-xs font-medium text-[#4D6166] dark:text-[#9FB2B8] uppercase tracking-wide">{label}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-xl font-semibold text-[#003844] dark:text-[#E9F1F2] truncate">{value}</p>
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
