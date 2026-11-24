import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState = ({
  title = 'Failed to load data',
  message = 'An unexpected error occurred while communicating with the server.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}>
      <div className="p-4 rounded-3xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4 shadow-inner">
        <AlertCircle className="w-8 h-8" />
      </div>
      <h4 className="text-base font-semibold text-white tracking-tight">{title}</h4>
      <p className="text-sm text-rose-300/80 max-w-sm mt-1 mb-6 leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" size="sm" icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
