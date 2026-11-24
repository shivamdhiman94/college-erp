import React from "react";
import { Link } from "react-router-dom";
import { Clock, MapPin, User, BookOpen, ChevronRight, Coffee } from "lucide-react";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TodaysClasses = ({ schedule }) => {
  const today = DAYS[new Date().getDay()];

  // schedule is an object keyed by day, each containing array of timetable slots
  const todayClasses = React.useMemo(() => {
    if (!schedule) return null;
    // Try to find todays classes from schedule object
    if (schedule[today]) return schedule[today];
    // Some backends return an array of all slots with a day field
    if (Array.isArray(schedule)) {
      return schedule.filter(s => s.day_of_week === today || s.day === today);
    }
    return [];
  }, [schedule, today]);

  const sortedClasses = React.useMemo(() => {
    if (!todayClasses || !todayClasses.length) return [];
    return [...todayClasses].sort((a, b) => {
      const ta = a.start_time || a.time || "00:00";
      const tb = b.start_time || b.time || "00:00";
      return ta.localeCompare(tb);
    });
  }, [todayClasses]);

  const formatTime = (t) => {
    if (!t) return "—";
    const [h, m] = t.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  const isCurrentClass = (start, end) => {
    if (!start) return false;
    const now = new Date();
    const [sh, sm] = start.split(":").map(Number);
    const startDate = new Date(); startDate.setHours(sh, sm, 0);
    if (end) {
      const [eh, em] = end.split(":").map(Number);
      const endDate = new Date(); endDate.setHours(eh, em, 0);
      return now >= startDate && now <= endDate;
    }
    return false;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Today&apos;s Classes</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">{today}</p>
        </div>
        <Link to="/student/timetable" className="text-xs text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1">
          Full Timetable <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {schedule === null ? (
        <ErrorState />
      ) : todayClasses === null ? (
        <LoadingState />
      ) : sortedClasses.length === 0 ? (
        <EmptyState day={today} />
      ) : (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
          {sortedClasses.map((cls, i) => {
            const start = cls.start_time || cls.time_from;
            const end = cls.end_time || cls.time_to;
            const subject = cls.subject?.name || cls.subject_name || cls.title || "Subject";
            const faculty = cls.faculty?.first_name
              ? `${cls.faculty.first_name} ${cls.faculty.last_name || ""}`.trim()
              : cls.faculty_name || "Faculty";
            const room = cls.room?.name || cls.room_name || cls.room_number || "—";
            const active = isCurrentClass(start, end);

            return (
              <div key={i} className={`flex gap-3 p-3 rounded-xl border transition-colors ${active ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-transparent hover:bg-slate-100"}`}>
                {/* Time column */}
                <div className="text-center shrink-0 w-16">
                  <p className="text-xs font-bold text-slate-700">{formatTime(start)}</p>
                  {end && <p className="text-[10px] text-slate-400">{formatTime(end)}</p>}
                  {active && <span className="mt-1 inline-flex items-center gap-0.5 text-[9px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded-full">LIVE</span>}
                </div>
                {/* Divider */}
                <div className="w-px bg-slate-200 shrink-0 self-stretch" />
                {/* Class info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{subject}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <User className="w-3 h-3" />{faculty}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-500">
                      <MapPin className="w-3 h-3" />{room}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ day }) => (
  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center gap-2">
    <Coffee className="w-10 h-10 text-slate-200" />
    <p className="text-sm font-semibold text-slate-500">No classes on {day}</p>
    <p className="text-xs text-slate-400">Enjoy your free day!</p>
  </div>
);
const LoadingState = () => (
  <div className="space-y-3">
    {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
  </div>
);
const ErrorState = () => (
  <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
    <BookOpen className="w-10 h-10 text-slate-200" />
    <p className="text-xs text-slate-400">Unable to load timetable</p>
  </div>
);
