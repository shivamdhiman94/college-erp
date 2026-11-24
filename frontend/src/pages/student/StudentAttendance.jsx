import React, { useState, useEffect } from 'react';
import { attendanceService } from '../../services/attendance.service';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';

export const StudentAttendance = () => {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAttendanceData = async () => {
      try {
        const [sumData, histData] = await Promise.all([
          attendanceService.getMyAttendance().catch(() => null),
          attendanceService.getMyHistory().catch(() => []),
        ]);
        setSummary(sumData);
        setHistory(histData || []);
      } catch (err) {
        console.error('Failed to load attendance:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAttendanceData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading your attendance records..." />
      </div>
    );
  }

  const overallPct = summary?.overall_percentage ?? 100.0;
  const isBelow = summary?.is_below_threshold ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <CalendarCheck2 className="w-6 h-6 text-brand-400" />
          <span>My Attendance & Compliance</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Monitor your lecture attendance across all enrolled subjects against the 75% institutional threshold.
        </p>
      </div>

      {/* Threshold Alert Banner if below 75% */}
      {isBelow && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-rose-200">Attendance Below Mandatory 75% Threshold</h4>
            <p className="leading-relaxed">
              Your overall attendance is currently <strong className="text-white">{overallPct}%</strong>.
              University regulations require at least 75.0% aggregate attendance to be eligible for end-term examinations. Please attend upcoming lectures to raise your compliance score.
            </p>
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overall Percentage Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Aggregate</p>
            <div className="p-2 rounded-xl bg-slate-800 text-brand-400">
              <CalendarCheck2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline space-x-2">
              <span className={`text-3xl font-black tracking-tight ${isBelow ? 'text-rose-400' : 'text-emerald-400'}`}>
                {overallPct}%
              </span>
              <Badge variant={isBelow ? 'danger' : 'success'} size="sm">
                {isBelow ? 'Shortage Alert' : 'Eligible'}
              </Badge>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${isBelow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(overallPct, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Registered Subjects */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subjects Tracked</p>
            <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-white tracking-tight">
              {summary?.subjects?.length || 0}
            </div>
            <div className="text-xs text-slate-400 mt-1">Current Semester Coursework</div>
          </div>
        </div>

        {/* Threshold Reference */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Required Minimum</p>
            <div className="p-2 rounded-xl bg-slate-800 text-amber-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-amber-300 tracking-tight">
              75.0%
            </div>
            <div className="text-xs text-slate-400 mt-1">Institutional Exam Rule</div>
          </div>
        </div>
      </div>

      {/* Subject-wise Breakdown Table */}
      <Card title="Subject-wise Attendance Breakdown" subtitle="Detailed class counts and percentage per course subject">
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
          <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
            <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase">
              <tr>
                <th className="px-4 py-3">Subject Code</th>
                <th className="px-4 py-3">Subject Name</th>
                <th className="px-4 py-3 text-center">Classes Held</th>
                <th className="px-4 py-3 text-center">Present</th>
                <th className="px-4 py-3 text-center">Absent</th>
                <th className="px-4 py-3 text-center">Late</th>
                <th className="px-4 py-3 text-center">Attendance %</th>
                <th className="px-4 py-3 text-right">Eligibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
              {summary?.subjects?.map((sub) => (
                <tr key={sub.subject_id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-brand-400">{sub.subject_code}</td>
                  <td className="px-4 py-3 text-white font-semibold">{sub.subject_name}</td>
                  <td className="px-4 py-3 text-center text-slate-300">{sub.total_classes}</td>
                  <td className="px-4 py-3 text-center text-emerald-400 font-bold">{sub.present_count}</td>
                  <td className="px-4 py-3 text-center text-rose-400 font-bold">{sub.absent_count}</td>
                  <td className="px-4 py-3 text-center text-amber-400">{sub.late_count}</td>
                  <td className="px-4 py-3 text-center font-bold text-sm">
                    <span className={sub.is_below_threshold ? 'text-rose-400' : 'text-emerald-400'}>
                      {sub.percentage}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Badge variant={sub.is_below_threshold ? 'danger' : 'success'} size="sm">
                      {sub.is_below_threshold ? 'SHORTAGE' : 'ELIGIBLE'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Daily Attendance History */}
      <Card title="Attendance Daily Roll Log" subtitle="Recent class sessions recorded by instructors">
        {history.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No attendance roll-calls recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Subject</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Topic Covered</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                {history.map((h) => (
                  <tr key={h.record_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-mono">{h.session_date}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {h.subject_code} - {h.subject_name}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{h.faculty_name}</td>
                    <td className="px-4 py-3 text-slate-400 italic">{h.topic_covered || 'Regular Lecture'}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          h.status === 'PRESENT'
                            ? 'success'
                            : h.status === 'ABSENT'
                            ? 'danger'
                            : h.status === 'LATE'
                            ? 'warning'
                            : 'cyan'
                        }
                        size="sm"
                      >
                        {h.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{h.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
