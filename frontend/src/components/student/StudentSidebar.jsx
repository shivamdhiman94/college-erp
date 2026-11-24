import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { STUDENT_NAV_ITEMS } from "../../utils/constants";
import {
  LayoutDashboard, User, CalendarCheck2, Clock, FileEdit, BookOpen,
  GraduationCap, Layers, Award, FileSpreadsheet, Calendar,
  BookMarked, Home, Bell, Briefcase, CalendarDays,
  CreditCard, Receipt, History, HelpCircle, Phone, X, ChevronLeft, ChevronRight, LogOut,
} from "lucide-react";

const ICON_MAP = {
  LayoutDashboard, User, CalendarCheck2, Clock, FileEdit, BookOpen,
  GraduationCap, Layers, Award, FileSpreadsheet, Calendar,
  BookMarked, Home, Bell, Briefcase, CalendarDays,
  CreditCard, Receipt, History, HelpCircle, Phone,
};

export const StudentSidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const displayName = user?.full_name || user?.username || "Student";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const renderIcon = (iconName) => {
    const Icon = ICON_MAP[iconName] || BookOpen;
    return <Icon className="w-4 h-4 shrink-0" />;
  };

  const renderNavItem = (item) => (
    <NavLink
      key={item.path + item.title}
      to={item.path}
      onClick={() => onClose && onClose()}
      title={collapsed ? item.title : undefined}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 ${
          isActive
            ? "bg-blue-50 text-blue-700 font-semibold"
            : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
        } ${collapsed ? "justify-center px-2" : ""}`
      }
    >
      {({ isActive }) => (
        <>
          <span className={`shrink-0 ${isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"}`}>
            {renderIcon(item.icon)}
          </span>
          {!collapsed && <span className="truncate leading-tight">{item.title}</span>}
          {!collapsed && isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />}
        </>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 shadow-sm ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-[68px]" : "w-[260px]"}`}
      >
        {/* Header */}
        <div className={`h-16 flex items-center border-b border-slate-100 shrink-0 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-sm">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold text-slate-900">Student Portal</span>
            </div>
          )}
          {/* Mobile close */}
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 lg:hidden">
            <X className="w-4 h-4" />
          </button>
          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-5">
          {STUDENT_NAV_ITEMS.map((section, idx) => (
            <div key={section.title || idx} className="space-y-0.5">
              {!collapsed && (
                <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  {section.title}
                </p>
              )}
              {collapsed && idx > 0 && <div className="border-t border-slate-100 mx-1 mb-2" />}
              <div className="space-y-0.5">
                {(section.items || []).map(item => renderNavItem(item))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom user section */}
        <div className={`p-3 border-t border-slate-100 bg-slate-50/60 shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
          {collapsed ? (
            <button
              onClick={() => logout("Logged out successfully.")}
              className="p-2 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">{displayName}</p>
                <p className="text-[10px] text-slate-500 leading-tight truncate">Student</p>
              </div>
              <button
                onClick={() => logout("Logged out successfully.")}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
