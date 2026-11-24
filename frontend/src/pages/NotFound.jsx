import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { ROLE_REDIRECTS } from '../utils/constants';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';

export const NotFound = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const homePath = (role && ROLE_REDIRECTS[role]) || '/login';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl glass-panel">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center mx-auto shadow-inner">
          <FileQuestion className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">404</h1>
          <h2 className="text-base font-semibold text-slate-300">Page Not Found</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            The page or ERP resource you requested does not exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" icon={Home} onClick={() => navigate(homePath)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
