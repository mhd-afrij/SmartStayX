import { forwardRef, useId } from 'react';

const FieldShell = ({ label, htmlFor, required, error, helper, children }) => (
  <div className="space-y-1.5">
    {label && (
      <label htmlFor={htmlFor} className="block text-sm font-medium text-[#0F172A]">
        {label}
        {required && <span className="text-[#DC2626] ml-0.5">*</span>}
      </label>
    )}
    {children}
    {error ? (
      <p className="text-xs text-[#DC2626]">{error}</p>
    ) : helper ? (
      <p className="text-xs text-[#94A3B8]">{helper}</p>
    ) : null}
  </div>
);

const baseInputClasses =
  'w-full h-11 rounded-[10px] border bg-white px-3.5 text-sm text-[#0F172A] placeholder:text-[#94A3B8] outline-none transition-colors disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:cursor-not-allowed';

const borderClasses = (error) =>
  error
    ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-3 focus:ring-[#DC2626]/15'
    : 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-3 focus:ring-[#2563EB]/15';

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
    <label htmlFor={inputId} className={`flex items-center gap-2.5 text-sm text-[#0F172A] cursor-pointer ${className}`}>
      <input
        ref={ref}
        id={inputId}
        type="checkbox"
        className="h-4 w-4 rounded border-[#E2E8F0] text-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/25"
        {...props}
      />
      {label}
    </label>
  );
});

export const Toggle = ({ checked, onChange, label, id }) => {
  const autoId = useId();
  const inputId = id || autoId;
  return (
    <label htmlFor={inputId} className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        id={inputId}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange?.(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}
        />
      </button>
      {label && <span className="text-sm text-[#0F172A]">{label}</span>}
    </label>
  );
};

export default Input;
