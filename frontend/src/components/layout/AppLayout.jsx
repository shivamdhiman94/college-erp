import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { StudentNavbar } from '../student/StudentNavbar';
import { StudentSidebar } from '../student/StudentSidebar';

export const AppLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { role } = useAuth();

  const isStudentPortal = role === 'STUDENT';

  // ── Student Portal Layout (white/blue light theme) ────────────────────────
  if (isStudentPortal) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
        {/* Student Sidebar */}
        <StudentSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Main content — shifts right when sidebar expanded (260px) */}
        <div className="flex flex-col flex-1 min-w-0 w-full min-h-screen lg:pl-[260px] transition-all duration-300">
          {/* Student Navbar */}
          <StudentNavbar onToggleSidebar={() => setIsSidebarOpen(s => !s)} />

          {/* Page content */}
          <main className="flex-1">
            <Outlet context={{ onToggleSidebar: () => setIsSidebarOpen(s => !s) }} />
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-200 py-3 px-6 text-center text-xs text-slate-400 bg-white">
            Quantum University ERP &copy; {new Date().getFullYear()} &mdash; Student Portal
          </footer>
        </div>
      </div>
    );
  }

  // ── Admin / Faculty Layout (dark slate theme) ─────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-brand-500 selection:text-white overflow-x-hidden">
      {/* Role-based Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main wrapper shifted on desktop to accommodate 280px sidebar */}
      <div className="lg:pl-[280px] flex flex-col flex-1 min-w-0 w-full">
        {/* Top Navbar */}
        <Navbar onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Dynamic page container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Breadcrumbs />
          <Outlet context={{ onToggleSidebar: () => setIsSidebarOpen(!isSidebarOpen) }} />
        </main>

        {/* Global Footer */}
        <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 bg-slate-950/40">
          Quantum University ERP &copy; {new Date().getFullYear()} — Enterprise Campus Management System
        </footer>
      </div>
    </div>
  );
};
