import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import {
  Menu,
  Bell,
  User,
  KeyRound,
  LogOut,
  ChevronDown,
  ShieldAlert,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, role, logout, changePassword } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(oldPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      setIsPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const getRoleBadgeVariant = (userRole) => {
    switch (userRole) {
      case 'ADMIN':
        return 'danger';
      case 'FACULTY':
        return 'primary';
      case 'STUDENT':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition-colors lg:hidden"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">
                Quantum University ERP
              </h1>
              <p className="text-[11px] text-slate-400 font-medium leading-tight mt-0.5">
                Enterprise Academic Management
              </p>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Active Session Indicator */}
          <div className="hidden md:flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Session: <strong className="text-slate-200">2025-2026</strong></span>
          </div>

          {/* User Profile Pill & Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center space-x-3 p-1.5 pr-3 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 transition-all focus:outline-none"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight">
                  {user?.full_name || user?.username || 'Authenticated User'}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  {user?.email}
                </div>
              </div>
              <Badge variant={getRoleBadgeVariant(role)} size="sm" className="hidden sm:inline-flex">
                {role}
              </Badge>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 glass-panel animate-in fade-in zoom-in-95">
                <div className="px-4 py-2.5 border-b border-slate-800/80">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.full_name || user?.username}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {user?.email}
                  </p>
                  <div className="mt-2 sm:hidden">
                    <Badge variant={getRoleBadgeVariant(role)} size="sm">
                      {role}
                    </Badge>
                  </div>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setIsPasswordModalOpen(true);
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-left"
                  >
                    <KeyRound className="w-4 h-4 text-slate-400" />
                    <span>Change Password</span>
                  </button>
                </div>

                <div className="border-t border-slate-800/80 pt-1">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout('You have been logged out.');
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Account Password"
        subtitle="Update your security credentials"
      >
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            placeholder="••••••••"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Repeat new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={passwordError}
            required
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button
              variant="secondary"
              onClick={() => setIsPasswordModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Update Password
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
