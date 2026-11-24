import React, { forwardRef } from 'react';

export const Select = forwardRef(({
  label,
  error,
  options = [],
  className = '',
  id,
  placeholder = 'Select an option',
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`block w-full rounded-xl border bg-slate-900/80 text-white focus:outline-none focus:ring-2 transition-all duration-200 text-sm py-2.5 px-3.5 ${
          error
            ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500 focus:ring-brand-500/20'
        } ${className}`}
        {...props}
      >
        <option value="" disabled className="bg-slate-900 text-slate-500">
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-slate-900 text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-rose-400 font-medium mt-1">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
