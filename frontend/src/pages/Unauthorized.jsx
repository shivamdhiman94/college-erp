import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { ROLE_REDIRECTS } from '../utils/constants';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const homePath = (role && ROLE_REDIRECTS[role]) || '/login';

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl glass-panel">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Access Restricted</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your current role (<strong className="text-slate-200">{role || 'GUEST'}</strong>) does not have authorization to view this module.
          </p>
        </div>
        <div className="flex items-center justify-center space-x-3 pt-2">
          <Button variant="secondary" icon={ArrowLeft} onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" icon={Home} onClick={() => navigate(homePath)}>
            My Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};
