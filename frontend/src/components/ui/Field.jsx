import { forwardRef, useId } from 'react';

const FieldShell = ({ label, htmlFor, required, error, helper, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#183B35] dark:text-[#F2EFE8]">
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-[#DC2626]">{error}</p>
    ) : helper ? (
      <p className="text-xs text-[#72766F] dark:text-[#A9AEA7]">{helper}</p>
    ) : null}
  </div>
);

const baseInputClasses =
  'w-full h-11 rounded-[10px] border bg-white dark:bg-[#1A1E1B] px-3.5 text-sm text-[#183B35] dark:text-[#F2EFE8] placeholder:text-[#72766F] dark:placeholder:text-[#A9AEA7] outline-none transition-colors disabled:bg-[#EFEEE8] dark:disabled:bg-[#111412] disabled:text-[#72766F] dark:disabled:text-[#A9AEA7] disabled:cursor-not-allowed';

const borderClasses = (error) =>
  error
    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/15'
    : 'border-[#E3E0D8] dark:border-[#303631] focus:border-[#A67C52] focus:ring-3 focus:ring-[#A67C52]/20';

export const Input = forwardRef(function Input(
  { label, error, helper, required, id, className = '', ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldShell label={label} htmlFor={inputId} required={required} error={error} helper={helper}>
      <input
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={!!error}
        className={`${baseInputClasses} ${borderClasses(error)} ${className}`}
        {...props}
      />
    </FieldShell>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, helper, required, id, className = '', rows = 4, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldShell label={label} htmlFor={inputId} required={required} error={error} helper={helper}>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        required={required}
        aria-invalid={!!error}
        className={`${baseInputClasses} h-auto py-2.5 resize-none ${borderClasses(error)} ${className}`}
        {...props}
      />
    </FieldShell>
  );
});

export const Select = forwardRef(function Select(
  { label, error, helper, required, id, className = '', children, ...props },
  ref
) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <FieldShell label={label} htmlFor={inputId} required={required} error={error} helper={helper}>
      <select
        ref={ref}
        id={inputId}
        required={required}
        aria-invalid={!!error}
        className={`${baseInputClasses} cursor-pointer ${borderClasses(error)} ${className}`}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  );
});

export const Checkbox = forwardRef(function Checkbox({ label, id, className = '', ...props }, ref) {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label htmlFor={inputId} className={`flex items-center gap-2.5 text-sm text-[#183B35] dark:text-[#F2EFE8] cursor-pointer ${className}`}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-[#E3E0D8] dark:border-[#303631] text-[#8A643F] dark:text-[#C5A47E] focus:ring-2 focus:ring-[#A67C52]/25"
        {...props}
      />
      {label}
    </label>
  );
});

export const Toggle = ({ checked, onChange, label, id, disabled }) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label htmlFor={inputId} className={`flex items-center gap-2.5 select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${checked ? 'bg-[#A67C52] dark:bg-[#C5A47E]' : 'bg-[#E3E0D8] dark:bg-[#303631]'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-[#1A1E1B] shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </button>
      {label && <span className="text-sm text-[#183B35] dark:text-[#F2EFE8]">{label}</span>}
    </label>
  );
};

export default Input;
