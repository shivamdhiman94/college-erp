import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  rightElement,
  className = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
          {label}
        </label>
      )}
      <div className="relative rounded-xl shadow-sm">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`block w-full rounded-xl border bg-slate-900/80 text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-200 text-sm py-2.5 ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${rightElement ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-700/80 hover:border-slate-600 focus:border-brand-500 focus:ring-brand-500/20'
          } ${className}`}
          {...props}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {rightElement}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-rose-400 font-medium mt-1">{error}</p>}
      {helperText && !error && <p className="text-xs text-slate-400 mt-1">{helperText}</p>}
    </div>
  );
});

Input.displayName = 'Input';
