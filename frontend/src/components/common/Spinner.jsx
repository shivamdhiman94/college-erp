import React from 'react';
import { Loader2 } from 'lucide-react';

export const Spinner = ({ size = 'md', className = '', label }) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <Loader2 className={`animate-spin text-brand-500 ${sizes[size]}`} />
      {label && <p className="text-xs text-slate-400 font-medium">{label}</p>}
    </div>
  );
};
