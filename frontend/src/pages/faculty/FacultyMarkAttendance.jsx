import React, { useState, useEffect, useCallback } from 'react';
import { facultyService } from '../../services/faculty.service';
import { attendanceService } from '../../services/attendance.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Users,
  BookOpen,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

export const FacultyMarkAttendance = () => {
  const [allocations, setAllocations] = useState([]);
  const [selectedAllocationId, setSelectedAllocationId] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [topicCovered, setTopicCovered] = useState('');

  // Roster state
  const [roster, setRoster] = useState([]);
  const [isAlreadyMarked, setIsAlreadyMarked] = useState(false);
  const [isLoadingAllocations, setIsLoadingAllocations] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { success, error, warning } = useToast();

  useEffect(() => {
    const loadAllocations = async () => {
      try {
        const data = await facultyService.getMyAllocations();
        setAllocations(data);
        if (data.length > 0) {
          setSelectedAllocationId(data[0].id.toString());
        }
      } catch (err) {
        error('Failed to load your assigned subjects.');
      } finally {
        setIsLoadingAllocations(false);
      }
    };
    loadAllocations();
  }, [error]);

  const loadRoster = useCallback(async (allocId, dateVal) => {
    if (!allocId) return;
    setIsLoadingRoster(true);
    try {
      const data = await attendanceService.getRosterForAllocation(allocId, dateVal);
      setRoster(data.students || []);
      setIsAlreadyMarked(data.is_already_marked);
      setTopicCovered(data.topic_covered || '');
      if (data.is_already_marked) {
        warning('Attendance has already been recorded for this date. Modifying will update records.');
      }
    } catch (err) {
      error('Failed to load student roster for this class.');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [error, warning]);

  useEffect(() => {
    if (selectedAllocationId) {
      loadRoster(selectedAllocationId, sessionDate);
    }
  }, [selectedAllocationId, sessionDate, loadRoster]);

  const handleStatusChange = (studentId, newStatus) => {
    setRoster((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, status: newStatus } : s))
    );
  };

  const handleRemarksChange = (studentId, newRemarks) => {
    setRoster((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks: newRemarks } : s))
    );
  };

  const setAllStatus = (statusToSet) => {
    setRoster((prev) => prev.map((s) => ({ ...s, status: statusToSet })));
  };

  const handleSaveAttendance = async () => {
    if (!selectedAllocationId || !sessionDate || roster.length === 0) {
      error('No student records to save.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        subject_allocation_id: parseInt(selectedAllocationId),
        session_date: sessionDate,
        topic_covered: topicCovered.trim() || null,
        records: roster.map((s) => ({
          student_id: s.student_id,
          status: s.status,
          remarks: s.remarks?.trim() || null,
        })),
      };

      await attendanceService.saveAttendanceSession(payload);
      success(`Attendance successfully ${isAlreadyMarked ? 'updated' : 'recorded'} for ${roster.length} students.`);
      setIsAlreadyMarked(true);
      setIsConfirmOpen(false);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to record attendance.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingAllocations) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading allocated subjects..." />
      </div>
    );
  }

  const selectedAlloc = allocations.find((a) => a.id.toString() === selectedAllocationId);

  const presentCount = roster.filter((s) => s.status === 'PRESENT').length;
  const absentCount = roster.filter((s) => s.status === 'ABSENT').length;
  const lateCount = roster.filter((s) => s.status === 'LATE').length;
  const excusedCount = roster.filter((s) => s.status === 'EXCUSED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <CalendarCheck2 className="w-6 h-6 text-brand-400" />
            <span>Mark Student Attendance</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Conduct daily lecture attendance roll-calls, record topics covered, and sync with institutional records.
          </p>
        </div>

        {roster.length > 0 && (
          <Button
            variant="primary"
            icon={Save}
            onClick={() => setIsConfirmOpen(true)}
            isLoading={isSubmitting}
          >
            {isAlreadyMarked ? 'Update Attendance' : 'Save Attendance'}
          </Button>
        )}
      </div>

      {/* Allocation & Date Selection Panel */}
      <Card bodyClassName="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Assigned Subject & Lecture Section"
              options={allocations.map((a) => ({
                value: a.id.toString(),
                label: `${a.subject?.code} - ${a.subject?.name} (Section ${a.section?.name})`,
              }))}
              value={selectedAllocationId}
              onChange={(e) => setSelectedAllocationId(e.target.value)}
              disabled={allocations.length === 0}
            />
          </div>
          <div>
            <Input
              label="Class Date"
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Lecture Topic / Syllabus Unit (Optional)"
              placeholder="e.g. Unit 3: Normalization & BCNF Forms"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              onClick={() => setAllStatus('PRESENT')}
            >
              Mark All Present
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
              onClick={() => setAllStatus('ABSENT')}
            >
              Mark All Absent
            </Button>
          </div>
        </div>
      </Card>

      {/* Live Attendance Stats Counter */}
      {roster.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Present</span>
            <div className="text-xl font-bold text-emerald-300 mt-0.5">{presentCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-400">Absent</span>
            <div className="text-xl font-bold text-rose-300 mt-0.5">{absentCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">Late</span>
            <div className="text-xl font-bold text-amber-300 mt-0.5">{lateCount}</div>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-center">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">Excused</span>
            <div className="text-xl font-bold text-cyan-300 mt-0.5">{excusedCount}</div>
          </div>
        </div>
      )}

      {/* Student Roster Table */}
      <Card bodyClassName="p-0">
        {isLoadingRoster ? (
          <div className="p-12 flex justify-center">
            <Spinner size="md" label="Loading student roster..." />
          </div>
        ) : roster.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No active students enrolled in this section. Please ensure students are assigned to Section {selectedAlloc?.section?.name}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Roll #</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Attendance Status</th>
                  <th className="px-4 py-3">Remarks / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {roster.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-brand-400">
                      {s.roll_number}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white font-semibold">{s.first_name} {s.last_name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{s.enrollment_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="inline-flex rounded-xl bg-slate-950 p-1 border border-slate-800 space-x-1">
                        {[
                          { id: 'PRESENT', label: 'P', color: 'bg-emerald-600 text-white' },
                          { id: 'ABSENT', label: 'A', color: 'bg-rose-600 text-white' },
                          { id: 'LATE', label: 'L', color: 'bg-amber-600 text-white' },
                          { id: 'EXCUSED', label: 'E', color: 'bg-cyan-600 text-white' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            type="button"
                            onClick={() => handleStatusChange(s.student_id, btn.id)}
                            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                              s.status === btn.id
                                ? btn.color
                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        placeholder="Add note..."
                        value={s.remarks || ''}
                        onChange={(e) => handleRemarksChange(s.student_id, e.target.value)}
                        className="w-full text-xs rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-slate-200 focus:outline-none focus:border-brand-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSaveAttendance}
        title="Confirm Attendance Submission"
        message={`Are you ready to submit attendance for ${roster.length} students on ${sessionDate}? (${presentCount} Present, ${absentCount} Absent, ${lateCount} Late, ${excusedCount} Excused)`}
        confirmText="Confirm & Save"
        isLoading={isSubmitting}
      />
    </div>
  );
};
