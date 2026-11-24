import React from "react";
import { Link } from "react-router-dom";
import { User, GraduationCap, Hash, BookOpen, ChevronRight } from "lucide-react";

export const ProfileSummaryCard = ({ profile, user }) => {
  const firstName = profile?.first_name || user?.full_name?.split(" ")[0] || "Student";
  const fullName = profile
    ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
    : user?.full_name || user?.username || "Student";

  const enrollNo = profile?.enrollment_number || "—";
  const rollNo = profile?.roll_number || "—";
  const course = profile?.course?.name || "B.Tech";
  const dept = profile?.department?.name || "Computer Science & Engineering";
  const semNum = profile?.current_semester?.semester_number || "—";
  const section = profile?.current_section?.name || "—";
  const initials = fullName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Gradient header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-500 px-5 pt-5 pb-8 text-white text-center relative">
        <div className="w-20 h-20 rounded-full bg-white mx-auto flex items-center justify-center text-blue-600 text-2xl font-bold shadow-lg border-4 border-white/30 select-none mb-3">
          {initials}
        </div>
        <h3 className="text-base font-bold leading-tight">{fullName}</h3>
        <p className="text-xs text-blue-100 mt-0.5 font-mono">{enrollNo}</p>
      </div>

      {/* Info pills */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3 space-y-2.5">
          <InfoRow icon={<GraduationCap className="w-3.5 h-3.5 text-blue-500" />} label="Course" value={course} />
          <InfoRow icon={<BookOpen className="w-3.5 h-3.5 text-blue-500" />} label="Branch" value={dept} />
          <InfoRow icon={<Hash className="w-3.5 h-3.5 text-blue-500" />} label="Roll No." value={rollNo} />
          <div className="flex gap-3">
            <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Semester</p>
              <p className="text-sm font-bold text-blue-700">{semNum}</p>
            </div>
            <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Section</p>
              <p className="text-sm font-bold text-blue-700">{section}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <Link
          to="/student/profile"
          className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
        >
          <User className="w-4 h-4" />
          View Full Profile
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-start gap-2">
    <span className="mt-0.5 shrink-0">{icon}</span>
    <div className="min-w-0">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <p className="text-xs font-semibold text-slate-800 leading-tight truncate">{value}</p>
    </div>
  </div>
);
