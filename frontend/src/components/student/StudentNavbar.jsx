import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  GraduationCap, Search, Bell, HelpCircle, User, Settings, LogOut,
  ChevronDown, Menu, X, Headphones,
} from "lucide-react";
import { noticeService } from "../../services/notice.service";
import { Modal } from "../common/Modal";
import { Input } from "../common/Input";
import { Button } from "../common/Button";

const SEARCH_LINKS = [
  { label: "Attendance", path: "/student/attendance", emoji: "📋" },
  { label: "Timetable", path: "/student/timetable", emoji: "🕐" },
  { label: "Assignments", path: "/student/assignments", emoji: "📝" },
  { label: "Results", path: "/student/results", emoji: "🏆" },
  { label: "Examination", path: "/student/results", emoji: "📄" },
  { label: "Fees", path: "/student/fees", emoji: "💳" },
  { label: "Library", path: "/student/library", emoji: "📚" },
  { label: "Notices / Circulars", path: "/student/notices", emoji: "🔔" },
  { label: "My Profile", path: "/student/profile", emoji: "👤" },
];

export const StudentNavbar = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { user, logout, changePassword } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotices, setRecentNotices] = useState([]);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    noticeService.getUnreadCount().then(d => setUnreadCount(d?.unread_count ?? 0)).catch(() => {});
    noticeService.getNotices({ limit: 4 }).then(d => {
      const list = Array.isArray(d) ? d : (d?.notices || []);
      setRecentNotices(list.slice(0, 4));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const filteredLinks = SEARCH_LINKS.filter(l =>
    l.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayName = user?.full_name || user?.username || "Student";
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword.length < 6) { setPasswordError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }
    setIsSubmitting(true);
    const res = await changePassword(oldPassword, newPassword);
    setIsSubmitting(false);
    if (res.success) { setIsPasswordModalOpen(false); setOldPassword(""); setNewPassword(""); setConfirmPassword(""); }
  };

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center px-4 sm:px-6 gap-3">
        <button onClick={onToggleSidebar} className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors lg:hidden focus:outline-none" aria-label="Toggle sidebar">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2.5 cursor-pointer select-none shrink-0" onClick={() => navigate("/student/dashboard")}>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none">Quantum University</p>
            <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider leading-tight mt-0.5">Student ERP Portal</p>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-auto relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search modules — Attendance, Fees, Library..."
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-700"
            />
            {searchQuery && <button onClick={() => { setSearchQuery(""); setSearchOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3.5 h-3.5" /></button>}
          </div>
          {searchOpen && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50">
              {filteredLinks.length === 0 ? (
                <p className="text-xs text-slate-400 px-4 py-2">No modules found.</p>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-4 pb-1">Quick Navigation</p>
                  {filteredLinks.map(link => (
                    <Link key={link.label} to={link.path} onClick={() => { setSearchOpen(false); setSearchQuery(""); }} className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                      <span className="text-base leading-none">{link.emoji}</span>
                      <span className="font-medium">{link.label}</span>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden xl:block text-xs text-slate-500 font-medium pr-2 border-r border-slate-200 mr-1">{today}</span>
          <div className="relative" ref={notifRef}>
            <button onClick={() => { setNotifOpen(o => !o); setProfileOpen(false); }} className="relative p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none" aria-label="Notifications">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">{unreadCount > 99 ? "99+" : unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl py-3 z-50">
                <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-bold text-slate-800">Notifications</p>
                  {unreadCount > 0 && <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{unreadCount} unread</span>}
                </div>
                <div className="py-1 max-h-72 overflow-y-auto">
                  {recentNotices.length === 0 ? (
                    <div className="px-4 py-6 text-center"><Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" /><p className="text-xs text-slate-400">No new notifications</p></div>
                  ) : recentNotices.map(n => (
                    <Link key={n.id} to="/student/notices" onClick={() => setNotifOpen(false)} className="block px-4 py-2.5 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-semibold text-slate-800 leading-tight">{n.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{n.category || "General"} · {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}</p>
                    </Link>
                  ))}
                </div>
                <div className="px-4 pt-2 border-t border-slate-100">
                  <Link to="/student/notices" onClick={() => setNotifOpen(false)} className="block text-center text-xs font-semibold text-blue-600 hover:text-blue-700 py-1">View All Notices →</Link>
                </div>
              </div>
            )}
          </div>
          <Link to="/student/subjects" className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Help & Support"><HelpCircle className="w-5 h-5" /></Link>
          <div className="relative" ref={profileRef}>
            <button onClick={() => { setProfileOpen(o => !o); setNotifOpen(false); }} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all focus:outline-none">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 text-white text-xs font-bold flex items-center justify-center shadow-sm">{initials}</div>
              <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[100px] truncate">{displayName.split(" ")[0]}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`} />
            </button>
            {profileOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-2xl py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link to="/student/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><User className="w-4 h-4 text-slate-400" />My Profile</Link>
                  <button onClick={() => { setProfileOpen(false); setIsPasswordModalOpen(true); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors text-left"><Settings className="w-4 h-4 text-slate-400" />Account Settings</button>
                  <Link to="/student/subjects" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"><Headphones className="w-4 h-4 text-slate-400" />Help & Support</Link>
                </div>
                <div className="border-t border-slate-100 pt-1">
                  <button onClick={() => { setProfileOpen(false); logout("Logged out successfully."); }} className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors text-left"><LogOut className="w-4 h-4" />Logout</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title="Change Password" subtitle="Update your account credentials">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <Input label="Current Password" type="password" placeholder="••••••••" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required />
          <Input label="New Password" type="password" placeholder="Minimum 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
          <Input label="Confirm New Password" type="password" placeholder="Repeat new password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} error={passwordError} required />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>Update Password</Button>
          </div>
        </form>
      </Modal>
    </>
  );
};
