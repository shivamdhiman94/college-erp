import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { studentService } from "../../services/student.service";
import { attendanceService } from "../../services/attendance.service";
import { examService } from "../../services/exam.service";
import { timetableService } from "../../services/timetable.service";
import { noticeService } from "../../services/notice.service";
import { assignmentService } from "../../services/assignment.service";
import { ProfileSummaryCard } from "../../components/student/dashboard/ProfileSummaryCard";
import { AttendanceCard } from "../../components/student/dashboard/AttendanceCard";
import { TodaysClasses } from "../../components/student/dashboard/TodaysClasses";
import { QuickAccessGrid } from "../../components/student/dashboard/QuickAccessGrid";
import { NoticesWidget } from "../../components/student/dashboard/NoticesWidget";
import { UpcomingWidget } from "../../components/student/dashboard/UpcomingWidget";
import { FeesSummaryCard } from "../../components/student/dashboard/FeesSummaryCard";
import { ResultsSummaryCard } from "../../components/student/dashboard/ResultsSummaryCard";
import { DashboardSkeleton } from "../../components/student/dashboard/DashboardSkeleton";
import { Sun, Sunrise, Moon, Sunset, RefreshCw, GraduationCap, MapPin, BookOpen } from "lucide-react";

// Helper: determine greeting
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: "Good Morning", Icon: Sunrise };
  if (h < 17) return { text: "Good Afternoon", Icon: Sun };
  if (h < 20) return { text: "Good Evening", Icon: Sunset };
  return { text: "Good Night", Icon: Moon };
};

export const StudentDashboard = () => {
  const { user } = useAuth();

  const [profile, setProfile] = useState(undefined);
  const [attendance, setAttendance] = useState(undefined);
  const [results, setResults] = useState(undefined);
  const [schedule, setSchedule] = useState(undefined);
  const [notices, setNotices] = useState(undefined);
  const [assignments, setAssignments] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const [profData, attData, resData, schedData, noticeData, assignData] = await Promise.all([
        studentService.getMyProfile().catch(() => null),
        attendanceService.getMyAttendance().catch(() => null),
        examService.getMyResults().catch(() => []),
        timetableService.getMyStudentSchedule().catch(() => null),
        noticeService.getNotices({ limit: 5 }).catch(() => []),
        assignmentService.getMyStudentAssignments().catch(() => []),
      ]);
      setProfile(profData);
      setAttendance(attData);
      setResults(resData || []);
      setSchedule(schedData);
      const noticeList = Array.isArray(noticeData) ? noticeData : noticeData?.notices || [];
      setNotices(noticeList);
      setAssignments(Array.isArray(assignData) ? assignData : []);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (isLoading) return <DashboardSkeleton />;

  if (hasError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
          <RefreshCw className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-base font-bold text-slate-800">Unable to load dashboard</p>
          <p className="text-sm text-slate-500 mt-1">Something went wrong while fetching your data.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
        >
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  // Dynamic data
  const firstName = profile?.first_name || user?.full_name?.split(" ")[0] || "Student";
  const semNum = profile?.current_semester?.semester_number || "—";
  const sectionName = profile?.current_section?.name || "—";
  const deptShort = profile?.department?.name || "Computer Science & Engineering";
  const courseName = profile?.course?.name || "B.Tech";

  const pendingAssignmentsCount = Array.isArray(assignments)
    ? assignments.filter(a => a.status === "PUBLISHED" && a.due_date && new Date(a.due_date) > new Date()).length
    : 0;
  const unreadNoticesCount = Array.isArray(notices) ? notices.filter(n => !n.is_read).length : 0;

  const { text: greetingText, Icon: GreetingIcon } = getGreeting();
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto">

      {/* ── DASHBOARD HEADER ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <GreetingIcon className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {greetingText}, {firstName}! <span className="text-2xl">👋</span>
            </h1>
          </div>
          <p className="text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your academic journey today.
          </p>
          <p className="text-xs text-slate-400 mt-1">{today}</p>
        </div>

        {/* Semester / Branch badges */}
        <div className="flex flex-wrap gap-2 sm:text-right">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
            <GraduationCap className="w-3.5 h-3.5" />
            {courseName}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
            <BookOpen className="w-3.5 h-3.5" />
            Semester {semNum} · Section {sectionName}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-semibold text-indigo-700">
            <MapPin className="w-3.5 h-3.5" />
            {deptShort}
          </span>
        </div>
      </div>

      {/* ── ROW 1: Profile + Attendance + Results + Fees ─────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="sm:col-span-1">
          <ProfileSummaryCard profile={profile} user={user} />
        </div>
        <div className="sm:col-span-1">
          <AttendanceCard attendance={attendance} />
        </div>
        <div className="sm:col-span-1">
          <ResultsSummaryCard results={results} />
        </div>
        <div className="sm:col-span-1">
          <FeesSummaryCard />
        </div>
      </div>

      {/* ── ROW 2: Today's Classes + Notices ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3">
          <TodaysClasses schedule={schedule} />
        </div>
        <div className="lg:col-span-2">
          <NoticesWidget notices={notices} />
        </div>
      </div>

      {/* ── ROW 3: Quick Access Grid ──────────────────────────────────────── */}
      <QuickAccessGrid
        assignmentCount={pendingAssignmentsCount}
        unreadNotices={unreadNoticesCount}
      />

      {/* ── ROW 4: Upcoming Deadlines & Events ───────────────────────────── */}
      <UpcomingWidget assignments={assignments} results={results} />

    </div>
  );
};
