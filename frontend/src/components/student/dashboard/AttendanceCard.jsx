import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle, XCircle, AlertTriangle, TrendingUp, ChevronRight } from "lucide-react";

export const AttendanceCard = ({ attendance }) => {
  const pct = attendance?.overall_percentage ?? null;
  const present = attendance?.total_present ?? 0;
  const absent = attendance?.total_absent ?? 0;
  const total = attendance?.total_classes ?? 0;

  const percentage = pct !== null ? Math.round(pct) : (total > 0 ? Math.round((present / total) * 100) : null);
  const isGood = percentage !== null && percentage >= 75;
  const isWarning = percentage !== null && percentage >= 60 && percentage < 75;
  const isDanger = percentage !== null && percentage < 60;

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = percentage !== null ? (percentage / 100) * circumference : 0;

  const circleColor = isDanger ? "#ef4444" : isWarning ? "#f59e0b" : "#2563eb";
  const bgColor = isDanger ? "bg-red-50" : isWarning ? "bg-amber-50" : "bg-blue-50";
  const textColor = isDanger ? "text-red-700" : isWarning ? "text-amber-700" : "text-blue-700";
  const statusText = isDanger ? "Attendance critical — urgent attention needed" : isWarning ? "Attendance low — needs improvement" : "Good attendance — keep it up!";
  const StatusIcon = isDanger ? XCircle : isWarning ? AlertTriangle : CheckCircle;
  const statusIconColor = isDanger ? "text-red-500" : isWarning ? "text-amber-500" : "text-emerald-500";

  if (attendance === null) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center gap-2 min-h-[180px]">
        <TrendingUp className="w-8 h-8 text-slate-300" />
        <p className="text-sm font-semibold text-slate-500">Attendance data unavailable</p>
        <p className="text-xs text-slate-400">No attendance records found yet</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">My Attendance</h3>
        <Link to="/student/attendance" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
          Details <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="flex items-center gap-5">
        {/* Circular progress */}
        <div className="relative shrink-0 w-32 h-32">
          <svg viewBox="0 0 128 128" className="w-32 h-32 -rotate-90">
            <circle cx="64" cy="64" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="10" />
            <circle
              cx="64" cy="64" r={radius} fill="none"
              stroke={circleColor} strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-extrabold text-slate-900">
              {percentage !== null ? `${percentage}%` : "—"}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Overall</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2.5">
          <Stat label="Present" value={present} color="text-emerald-600" bg="bg-emerald-50" />
          <Stat label="Absent" value={absent} color="text-red-500" bg="bg-red-50" />
          <Stat label="Total" value={total} color="text-blue-600" bg="bg-blue-50" />
        </div>
      </div>

      {/* Status badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${bgColor}`}>
        <StatusIcon className={`w-4 h-4 shrink-0 ${statusIconColor}`} />
        <p className={`text-xs font-semibold ${textColor} leading-tight`}>{statusText}</p>
      </div>
    </div>
  );
};

const Stat = ({ label, value, color, bg }) => (
  <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg ${bg}`}>
    <span className="text-xs font-semibold text-slate-600">{label}</span>
    <span className={`text-sm font-extrabold ${color}`}>{value}</span>
  </div>
);
