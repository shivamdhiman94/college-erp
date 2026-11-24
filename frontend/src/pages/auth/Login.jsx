import React, { useState } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { GraduationCap, Lock, User, Eye, EyeOff, ShieldCheck, Sparkles, UserCheck, BookOpen, School } from 'lucide-react';

const DEMO_PRESETS = [
  {
    role: 'ADMIN',
    category: 'Admin',
    name: 'Shivam Kumar',
    username: 'shivam',
    password: 'shivam@123',
    desc: 'Director & Super Admin',
    color: 'from-brand-500 to-indigo-600',
    badgeClass: 'bg-brand-500/10 text-brand-400 border-brand-500/30'
  },
  {
    role: 'FACULTY',
    category: 'Faculty',
    name: 'Prof. Riya Sharma',
    username: 'riya',
    password: 'riya@123',
    desc: 'HOD Computer Science',
    color: 'from-indigo-500 to-purple-600',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    role: 'FACULTY',
    category: 'Faculty',
    name: 'Prof. Sonu Kumar',
    username: 'sonu',
    password: 'sonu@123',
    desc: 'Associate Professor (CSE)',
    color: 'from-indigo-500 to-purple-600',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    role: 'FACULTY',
    category: 'Faculty',
    name: 'Prof. Niraj Singh',
    username: 'niraj',
    password: 'niraj@123',
    desc: 'Assistant Professor (ECE)',
    color: 'from-indigo-500 to-purple-600',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    role: 'FACULTY',
    category: 'Faculty',
    name: 'Prof. Kartik Verma',
    username: 'kartik',
    password: 'kartik@123',
    desc: 'Assistant Professor (ME)',
    color: 'from-indigo-500 to-purple-600',
    badgeClass: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  },
  {
    role: 'STUDENT',
    category: 'Student',
    name: 'Aarav Sharma',
    username: 'aarav',
    password: 'aarav@123',
    desc: 'B.Tech CSE (Sec A)',
    color: 'from-emerald-500 to-teal-600',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    role: 'STUDENT',
    category: 'Student',
    name: 'Priya Patel',
    username: 'priya',
    password: 'priya@123',
    desc: 'B.Tech CSE (Sec A)',
    color: 'from-emerald-500 to-teal-600',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    role: 'STUDENT',
    category: 'Student',
    name: 'Rahul Verma',
    username: 'rahul',
    password: 'rahul@123',
    desc: 'B.Tech CSE (Sec A)',
    color: 'from-emerald-500 to-teal-600',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
];

export const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, role } = useAuth();

  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ADMIN, FACULTY, STUDENT

  // If user is already authenticated, redirect to role home
  if (isAuthenticated && role) {
    const from = location.state?.from?.pathname;
    if (from && !from.includes('/login')) {
      return <Navigate to={from} replace />;
    }
    const defaultRoute = role === 'ADMIN' ? '/admin/dashboard' : role === 'FACULTY' ? '/faculty/dashboard' : '/student/dashboard';
    return <Navigate to={defaultRoute} replace />;
  }

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError('');

    if (!usernameOrEmail.trim() || !password.trim()) {
      setFormError('Please enter both your username/email and password.');
      return;
    }

    setIsLoading(true);
    const result = await login(usernameOrEmail.trim(), password);
    setIsLoading(false);

    if (result.success) {
      const from = location.state?.from?.pathname;
      navigate(from || result.redirectPath, { replace: true });
    } else {
      setFormError(result.error || 'Authentication failed. Please verify your credentials.');
    }
  };

  const handleSelectPreset = async (preset, autoSignIn = false) => {
    setFormError('');
    setUsernameOrEmail(preset.username);
    setPassword(preset.password);

    if (autoSignIn) {
      setIsLoading(true);
      const result = await login(preset.username, preset.password);
      setIsLoading(false);
      if (result.success) {
        navigate(result.redirectPath, { replace: true });
      } else {
        setFormError(result.error || 'Authentication failed.');
      }
    }
  };

  const filteredPresets = activeTab === 'ALL'
    ? DEMO_PRESETS
    : DEMO_PRESETS.filter(p => p.category.toUpperCase() === activeTab);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans selection:bg-brand-500 selection:text-white">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-brand-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Main Content Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        {/* College Logo and Header */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-purple-600 text-white shadow-2xl shadow-brand-500/25 border border-white/10 mx-auto">
            <GraduationCap className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Quantum University ERP
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1">
              Centralized Enterprise Portal & Academic Management
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800/90 p-6 sm:p-8 shadow-2xl backdrop-blur-xl glass-panel">
          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-center space-x-2.5 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username or Institutional Email"
              type="text"
              placeholder="e.g. shivam, riya, or aarav"
              icon={User}
              value={usernameOrEmail}
              onChange={(e) => setUsernameOrEmail(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-200 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full text-sm font-semibold tracking-wide"
                isLoading={isLoading}
              >
                Sign In to ERP
              </Button>
            </div>
          </form>

          {/* Quick Demo Access Header */}
          <div className="mt-8 pt-6 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                <span>Instant Demo Accounts</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium">Click to fill or login</span>
            </div>

            {/* Filter Tabs */}
            <div className="flex space-x-1 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80 mb-3 text-xs">
              {['ALL', 'ADMIN', 'FACULTY', 'STUDENT'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-1 text-center font-medium rounded-lg transition-all ${
                    activeTab === tab
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Account List Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredPresets.map((preset) => (
                <div
                  key={preset.username}
                  className="p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-brand-500/50 transition-all flex items-center justify-between group"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(preset, false)}
                    className="text-left flex-1 min-w-0 pr-2 focus:outline-none"
                    title={`Fill: ${preset.username} / ${preset.password}`}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-brand-300 truncate">
                        {preset.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {preset.username} &bull; {preset.password}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate">
                      {preset.desc}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPreset(preset, true)}
                    className="px-2 py-1 text-[10px] font-semibold rounded-lg bg-brand-600/20 hover:bg-brand-600 text-brand-300 hover:text-white border border-brand-500/30 transition-all shrink-0 focus:outline-none"
                    title="Sign in immediately"
                  >
                    Login
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-slate-500 mt-6">
          Authorized personnel access only. Protected by JWT 256-bit encryption.
        </p>
      </div>
    </div>
  );
};
