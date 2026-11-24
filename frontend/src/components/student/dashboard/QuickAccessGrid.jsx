import React from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck2, Clock, FileEdit, Award, FileSpreadsheet,
  CreditCard, BookMarked, Bell,
  ChevronRight,
} from "lucide-react";

const QUICK_CARDS = [
  {
    title: "Attendance",
    desc: "Check your attendance records",
    path: "/student/attendance",
    icon: CalendarCheck2,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    iconBg: "bg-blue-100",
  },
  {
    title: "Timetable",
    desc: "View weekly class schedule",
    path: "/student/timetable",
    icon: Clock,
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
    iconBg: "bg-indigo-100",
  },
  {
    title: "Assignments",
    desc: "View & submit assignments",
    path: "/student/assignments",
    icon: FileEdit,
    color: "bg-violet-50 text-violet-600",
    border: "border-violet-100",
    iconBg: "bg-violet-100",
  },
  {
    title: "Results",
    desc: "View grade cards & CGPA",
    path: "/student/results",
    icon: Award,
    color: "bg-emerald-50 text-emerald-600",
    border: "border-emerald-100",
    iconBg: "bg-emerald-100",
  },
  {
    title: "Examination",
    desc: "Exam schedule & notices",
    path: "/student/results",
    icon: FileSpreadsheet,
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
    iconBg: "bg-orange-100",
  },
  {
    title: "Fees",
    desc: "View fees & payments",
    path: "/student/fees",
    icon: CreditCard,
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
    iconBg: "bg-green-100",
  },
  {
    title: "Library",
    desc: "Books & library services",
    path: "/student/library",
    icon: BookMarked,
    color: "bg-amber-50 text-amber-600",
    border: "border-amber-100",
    iconBg: "bg-amber-100",
  },
  {
    title: "Circulars",
    desc: "Important university notices",
    path: "/student/notices",
    icon: Bell,
    color: "bg-pink-50 text-pink-600",
    border: "border-pink-100",
    iconBg: "bg-pink-100",
  },
];

export const QuickAccessGrid = ({ assignmentCount = 0, unreadNotices = 0 }) => {
  const getBadge = (title) => {
    if (title === "Assignments" && assignmentCount > 0) return assignmentCount;
    if (title === "Circulars" && unreadNotices > 0) return unreadNotices;
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Quick Access</h3>
        <p className="text-[11px] text-slate-400">Jump to any module instantly</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
        {QUICK_CARDS.map(card => {
          const Icon = card.icon;
          const badge = getBadge(card.title);
          return (
            <Link
              key={card.title}
              to={card.path}
              className={`group bg-white rounded-2xl border ${card.border} p-4 flex flex-col gap-3 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative overflow-hidden`}
            >
              <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center relative`}>
                <Icon className={`w-5 h-5 ${card.color.split(" ")[1]}`} />
                {badge !== null && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{card.title}</p>
                <p className="text-[11px] text-slate-500 leading-tight">{card.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all mt-auto" />
            </Link>
          );
        })}
      </div>
    </div>
  );
};
