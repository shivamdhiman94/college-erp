import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  ADMIN_NAV_ITEMS,
  FACULTY_NAV_ITEMS,
  STUDENT_NAV_ITEMS,
} from '../../utils/constants';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Users,
  UserCheck,
  ShieldCheck,
  CalendarCheck2,
  Clock,
  Award,
  FileSpreadsheet,
  FileEdit,
  Bell,
  CreditCard,
  BookMarked,
  BarChart3,
  Settings,
  User,
  LogOut,
  X,
} from 'lucide-react';

const ICON_MAP = {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  Users,
  UserCheck,
  ShieldCheck,
  CalendarCheck2,
  Clock,
  Award,
  FileSpreadsheet,
  FileEdit,
  Bell,
  CreditCard,
  BookMarked,
  BarChart3,
  Settings,
  User,
};

export const Sidebar = ({ isOpen, onClose }) => {
  const { role, logout, user } = useAuth();

  const getNavSections = () => {
    switch (role) {
      case 'ADMIN':
        return ADMIN_NAV_ITEMS;
      case 'FACULTY':
        return FACULTY_NAV_ITEMS;
      case 'STUDENT':
        return STUDENT_NAV_ITEMS;
      default:
        return [];
    }
  };

  const navSections = getNavSections();

  const renderIcon = (iconName) => {
    const IconComponent = ICON_MAP[iconName] || BookOpen;
    return <IconComponent className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />;
  };

  const renderNavItem = (item) => (
    <NavLink
      key={item.path}
      to={item.path}
      onClick={() => onClose && onClose()}
      className={({ isActive }) =>
        `group flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 shadow-sm shadow-brand-500/10'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
        }`
      }
    >
      {renderIcon(item.icon)}
      <span className="truncate">{item.title}</span>
    </NavLink>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container - 280px fixed width */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-[280px] bg-slate-950 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header branding for mobile */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80 lg:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-600 flex items-center justify-center text-white">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-white tracking-tight">Quantum ERP</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {navSections.map((section, idx) => {
            if (section.items) {
              return (
                <div key={section.title || idx} className="space-y-1.5">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {section.title}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item) => renderNavItem(item))}
                  </div>
                </div>
              );
            }
            return (
              <div key={section.path || idx} className="space-y-1">
                {renderNavItem(section)}
              </div>
            );
          })}
        </div>

        {/* Bottom User info & Quick Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5 truncate">
              <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-white truncate leading-tight">
                  {user?.full_name || user?.username}
                </p>
                <p className="text-[10px] text-slate-400 truncate leading-tight mt-0.5">
                  {role} Portal
                </p>
              </div>
            </div>
            <button
              onClick={() => logout('Logged out successfully')}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
