import React from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, Pin, AlertCircle, Megaphone } from "lucide-react";

const CATEGORY_COLORS = {
  ACADEMIC: "bg-blue-100 text-blue-700",
  EXAM: "bg-orange-100 text-orange-700",
  FEE: "bg-green-100 text-green-700",
  HOSTEL: "bg-purple-100 text-purple-700",
  PLACEMENT: "bg-indigo-100 text-indigo-700",
  GENERAL: "bg-slate-100 text-slate-600",
  EVENT: "bg-pink-100 text-pink-700",
};

export const NoticesWidget = ({ notices }) => {
  if (!notices) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <Header />
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
      </div>
    );
  }

  if (notices.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
        <Header />
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <Bell className="w-10 h-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-500">No notices</p>
          <p className="text-xs text-slate-400">Check back later for updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <Header />
      <div className="space-y-2.5 flex-1">
        {notices.slice(0, 5).map(n => {
          const cat = (n.category || "GENERAL").toUpperCase();
          const colorClass = CATEGORY_COLORS[cat] || CATEGORY_COLORS.GENERAL;
          const date = n.created_at ? new Date(n.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "";

          return (
            <Link
              key={n.id}
              to="/student/notices"
              className={`block p-3 rounded-xl border transition-colors hover:bg-slate-50 ${n.is_pinned ? "border-orange-200 bg-orange-50/30" : "border-slate-100"}`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`mt-0.5 shrink-0 p-1 rounded-lg ${n.is_pinned ? "bg-orange-100" : "bg-slate-100"}`}>
                  {n.is_pinned ? <Pin className="w-3 h-3 text-orange-600" /> : <Megaphone className="w-3 h-3 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colorClass}`}>{cat}</span>
                    {n.is_pinned && <span className="text-[10px] font-bold text-orange-600">📌 Pinned</span>}
                    <span className="text-[10px] text-slate-400 ml-auto shrink-0">{date}</span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-2">{n.title}</p>
                  {n.content && <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{n.content.replace(/<[^>]*>/g, "")}</p>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      <Link to="/student/notices" className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 border-t border-slate-100 pt-3 transition-colors">
        View All Notices <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
};

const Header = () => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
        <AlertCircle className="w-4 h-4 text-orange-600" />
      </div>
      <h3 className="text-sm font-bold text-slate-800">Important Notices</h3>
    </div>
    <Link to="/student/notices" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
      View All <ChevronRight className="w-3.5 h-3.5" />
    </Link>
  </div>
);
