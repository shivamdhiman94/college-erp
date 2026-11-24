import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from './Button';

export const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are no items to display at this moment.',
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}>
      <div className="p-4 rounded-3xl bg-slate-800/80 text-slate-400 border border-slate-700/60 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-white tracking-tight">{title}</h4>
      <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
