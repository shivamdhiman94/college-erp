import React from 'react';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  icon: Icon,
  className = '',
  bodyClassName = '',
  footer,
}) => {
  return (
    <div
      className={`rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-xl overflow-hidden backdrop-blur-md ${className}`}
    >
      {(title || action || Icon) && (
        <div className="flex items-center justify-between border-b border-slate-800/60 px-6 py-4">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="text-base font-semibold text-white tracking-tight">{title}</h3>}
              {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={`p-6 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="border-t border-slate-800/60 bg-slate-950/40 px-6 py-3.5">
          {footer}
        </div>
      )}
    </div>
  );
};
