import React from "react";
import { Link } from "react-router-dom";
import { FileText, Award, ChevronRight, CalendarDays, Clock } from "lucide-react";

export const UpcomingWidget = ({ assignments, results }) => {
  const pendingAssignments = React.useMemo(() => {
    if (!Array.isArray(assignments)) return [];
    return assignments
      .filter(a => a.status === "PUBLISHED" && a.due_date && new Date(a.due_date) > new Date())
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 3);
  }, [assignments]);

  const upcomingExams = React.useMemo(() => {
    if (!Array.isArray(results)) return [];
    return results
      .filter(r => r.exam?.start_date && new Date(r.exam.start_date) > new Date())
      .sort((a, b) => new Date(a.exam.start_date) - new Date(b.exam.start_date))
      .slice(0, 2);
  }, [results]);

  const hasData = pendingAssignments.length > 0 || upcomingExams.length > 0;

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((d - now) / (1000 * 60 * 60 * 24));
    const dateFormatted = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    if (diffDays === 0) return `Today · ${dateFormatted}`;
    if (diffDays === 1) return `Tomorrow · ${dateFormatted}`;
    if (diffDays <= 7) return `${diffDays} days left · ${dateFormatted}`;
    return dateFormatted;
  };

  const getDaysLeft = (dateStr) => {
    if (!dateStr) return null;
    const diffDays = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const urgencyStyle = (days) => {
    if (days === null) return "bg-slate-100 text-slate-600";
    if (days <= 1) return "bg-red-100 text-red-700";
    if (days <= 3) return "bg-orange-100 text-orange-700";
    return "bg-blue-50 text-blue-700";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-violet-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">Upcoming</h3>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/student/assignments" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">Assignments <ChevronRight className="w-3.5 h-3.5" /></Link>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <CalendarDays className="w-10 h-10 text-slate-200" />
          <p className="text-sm font-semibold text-slate-500">No upcoming deadlines</p>
          <p className="text-xs text-slate-400">You are all caught up!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Assignment deadlines */}
          {pendingAssignments.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><FileText className="w-3 h-3" />Assignment Deadlines</p>
              {pendingAssignments.map(a => {
                const days = getDaysLeft(a.due_date);
                return (
                  <Link key={a.id} to="/student/assignments" className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{a.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{a.subject?.name || "Subject"}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${urgencyStyle(days)}`}>
                        {days !== null ? (days <= 0 ? "Overdue" : `${days}d`) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(a.due_date)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Upcoming exams */}
          {upcomingExams.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1"><Award className="w-3 h-3" />Upcoming Exams</p>
              {upcomingExams.map((r, i) => {
                const days = getDaysLeft(r.exam?.start_date);
                return (
                  <Link key={r.id || i} to="/student/results" className="block p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-100 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{r.exam?.name || "Examination"}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Semester {r.exam?.semester?.semester_number || "—"}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg ${urgencyStyle(days)}`}>
                        {days !== null ? `${days}d` : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      {formatDate(r.exam?.start_date)}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* If one column is empty, show helper */}
          {pendingAssignments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 gap-1 bg-slate-50 rounded-xl border border-slate-100">
              <FileText className="w-6 h-6 text-slate-300" />
              <p className="text-xs text-slate-400 text-center">No pending assignments</p>
            </div>
          )}
          {upcomingExams.length === 0 && (
            <div className="flex flex-col items-center justify-center py-4 gap-1 bg-slate-50 rounded-xl border border-slate-100">
              <Award className="w-6 h-6 text-slate-300" />
              <p className="text-xs text-slate-400 text-center">No upcoming exams</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
