import React, { useState, useEffect, useCallback } from 'react';
import { attendanceService } from '../../services/attendance.service';
import { sectionService } from '../../services/academic.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  CalendarCheck2,
  AlertTriangle,
  RefreshCw,
  Users,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';

export const AdminAttendanceOverview = () => {
  const [sections, setSections] = useState([]);
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [sectionReports, setSectionReports] = useState([]);
  const [allSessions, setAllSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const secList = await sectionService.getAll();
      setSections(secList);
      if (secList.length > 0) {
        setSelectedSectionId(secList[0].id.toString());
      }
    } catch (err) {
      console.error('Failed to load sections:', err);
    }
  }, []);

  const fetchAttendanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sessionsData, repData] = await Promise.all([
        attendanceService.listSessions({ limit: 50 }),
        selectedSectionId ? attendanceService.getSectionReport(parseInt(selectedSectionId)) : Promise.resolve([]),
      ]);
      setAllSessions(sessionsData);
      setSectionReports(repData);
    } catch (err) {
      error('Failed to load attendance compliance overview.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSectionId, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchAttendanceData();
  }, [fetchAttendanceData]);

  const selectedSec = sections.find((s) => s.id.toString() === selectedSectionId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <CalendarCheck2 className="w-6 h-6 text-brand-400" />
            <span>Institution Attendance & Compliance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Monitor campus-wide lecture roll-calls, section attendance distributions, and mandatory 75% threshold compliance.
          </p>
        </div>
        <Button variant="secondary" icon={RefreshCw} onClick={fetchAttendanceData}>
          Refresh Overview
        </Button>
      </div>

      {/* Filter Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80">
            <Select
              label="Select Section to Inspect Compliance"
              options={sections.map((sec) => ({
                value: sec.id.toString(),
                label: `Section ${sec.name} — ${sec.semester?.course?.code || ''} (${sec.semester?.name || ''})`,
              }))}
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
            />
          </div>
          <div className="text-xs text-slate-400">
            Threshold Standard: <strong className="text-amber-400 font-bold">75.0% Minimum</strong>
          </div>
        </div>
      </Card>

      {/* Section Compliance Table */}
      <Card
        title={`Section ${selectedSec?.name || ''} Subject Compliance Matrix`}
        subtitle={`${selectedSec?.semester?.course?.name || 'Program'} • ${selectedSec?.semester?.name || ''}`}
      >
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <Spinner size="md" label="Calculating section attendance averages..." />
          </div>
        ) : sectionReports.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No subject allocations or attendance sessions recorded for this section yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Subject Code</th>
                  <th className="px-4 py-3">Subject Name</th>
                  <th className="px-4 py-3 text-center">Sessions Held</th>
                  <th className="px-4 py-3 text-center">Enrolled Students</th>
                  <th className="px-4 py-3 text-center">Avg. Attendance</th>
                  <th className="px-4 py-3 text-right">Shortage (&lt; 75%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                {sectionReports.map((rep) => (
                  <tr key={rep.subject_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-brand-400">{rep.subject_code}</td>
                    <td className="px-4 py-3 text-white font-semibold">{rep.subject_name}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{rep.total_sessions_held}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{rep.total_students_enrolled}</td>
                    <td className="px-4 py-3 text-center font-bold">
                      <span className={rep.average_attendance_percentage < 75 ? 'text-rose-400' : 'text-emerald-400'}>
                        {rep.average_attendance_percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {rep.students_below_threshold_count > 0 ? (
                        <Badge variant="danger" size="sm">
                          {rep.students_below_threshold_count} Students
                        </Badge>
                      ) : (
                        <Badge variant="success" size="sm">
                          All Eligible
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Campus-wide Attendance Sessions Log */}
      <Card title="Campus-wide Recent Lecture Attendance Sessions" subtitle="Latest class roll-calls taken by faculty">
        {allSessions.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No attendance sessions recorded campus-wide yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Subject & Code</th>
                  <th className="px-4 py-3">Section</th>
                  <th className="px-4 py-3">Instructor</th>
                  <th className="px-4 py-3">Topic Covered</th>
                  <th className="px-4 py-3 text-right">Records</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                {allSessions.map((sess) => (
                  <tr key={sess.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 text-slate-300 font-mono">{sess.session_date}</td>
                    <td className="px-4 py-3 font-semibold text-white">
                      {sess.allocation?.subject?.code} - {sess.allocation?.subject?.name}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="primary" size="sm">Sec {sess.allocation?.section?.name}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {sess.allocation?.faculty ? `${sess.allocation.faculty.first_name} ${sess.allocation.faculty.last_name}` : `Faculty #${sess.taken_by_faculty_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-400 italic">{sess.topic_covered || 'Regular Lecture'}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-emerald-400 font-bold">{sess.records?.length || 0}</span> students marked
                    </td>
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
