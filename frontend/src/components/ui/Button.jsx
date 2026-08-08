import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm',
  secondary: 'bg-[#F1F5F9] text-[#0F172A] hover:bg-[#E2E8F0]',
  outline: 'bg-white text-[#0F172A] border border-[#E2E8F0] hover:border-[#2563EB]',
  ghost: 'bg-transparent text-[#0F172A] hover:bg-[#F1F5F9]',
  danger: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm',
};

const SIZES = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-[52px] px-6 text-base gap-2',
};

const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', icon: Icon, loading = false, disabled, className = '', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-[10px] font-semibold transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
});

export const IconButton = forwardRef(function IconButton(
  { icon: Icon, variant = 'ghost', size = 'md', label, className = '', ...props },
  ref
) {
  const sizePx = { sm: 'h-9 w-9', md: 'h-11 w-11', lg: 'h-[52px] w-[52px]' };
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center rounded-[10px] transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.96] ${VARIANTS[variant]} ${sizePx[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="h-4 w-4" />}
    </button>
  );
});

export default Button;
