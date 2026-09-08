import { forwardRef, useId } from 'react';

const FieldShell = ({ label, htmlFor, required, error, helper, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#003844] dark:text-[#E9F1F2]">
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-[#DC2626]">{error}</p>
    ) : helper ? (
      <p className="text-xs text-[#879497] dark:text-[#6B828A]">{helper}</p>
    ) : null}
  </div>
);

const baseInputClasses =
  'w-full h-11 rounded-[10px] border bg-white dark:bg-[#161925] px-3.5 text-sm text-[#003844] dark:text-[#E9F1F2] placeholder:text-[#879497] dark:placeholder:text-[#6B828A] outline-none transition-colors disabled:bg-[#F3ECDE] dark:disabled:bg-[#10131D] disabled:text-[#879497] dark:disabled:text-[#6B828A] disabled:cursor-not-allowed';

const borderClasses = (error) =>
  error
    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/15'
    : 'border-[#E8E0D1] dark:border-[#232737] focus:border-[#D4A853] focus:ring-3 focus:ring-[#D4A853]/20';

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
    <label htmlFor={inputId} className={`flex items-center gap-2.5 text-sm text-[#003844] dark:text-[#E9F1F2] cursor-pointer ${className}`}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-[#E8E0D1] dark:border-[#232737] text-[#B58A2E] dark:text-[#E6C075] focus:ring-2 focus:ring-[#D4A853]/25"
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
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed ${checked ? 'bg-[#D4A853] dark:bg-[#E6C075]' : 'bg-[#E8E0D1] dark:bg-[#232737]'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-[#161925] shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </button>
      {label && <span className="text-sm text-[#003844] dark:text-[#E9F1F2]">{label}</span>}
    </label>
  );
};

export default Input;
