import React, { useState, useEffect, useCallback } from 'react';
import { examService } from '../../services/exam.service';
import { facultyService } from '../../services/faculty.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  Award,
  Save,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Lock,
  Sparkles,
} from 'lucide-react';

export const FacultyMarksEntry = () => {
  const [exams, setExams] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [schedules, setSchedules] = useState([]);

  // Roster state
  const [rosterData, setRosterData] = useState(null);
  const [studentMarks, setStudentMarks] = useState([]);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [actionType, setActionType] = useState('draft'); // 'draft' | 'finalize'

  const { success, error, warning } = useToast();

  useEffect(() => {
    const loadExams = async () => {
      try {
        const data = await examService.getExams();
        setExams(data);
        if (data.length > 0) {
          setSelectedExamId(data[0].id.toString());
        }
      } catch (err) {
        error('Failed to load examinations list.');
      } finally {
        setIsLoadingExams(false);
      }
    };
    loadExams();
  }, [error]);

  useEffect(() => {
    if (!selectedExamId) return;
    const currentExam = exams.find((e) => e.id.toString() === selectedExamId);
    if (currentExam && currentExam.schedules) {
      setSchedules(currentExam.schedules);
      if (currentExam.schedules.length > 0) {
        setSelectedScheduleId(currentExam.schedules[0].id.toString());
      } else {
        setSelectedScheduleId('');
        setRosterData(null);
        setStudentMarks([]);
      }
    }
  }, [selectedExamId, exams]);

  const loadRoster = useCallback(async (schId) => {
    if (!schId) return;
    setIsLoadingRoster(true);
    try {
      const data = await examService.getStudentsForSchedule(parseInt(schId));
      setRosterData(data);
      setStudentMarks(data.students || []);
      setIsFinalized(data.is_finalized);
      if (data.is_finalized) {
        warning('Marks for this examination paper have already been finalized.');
      }
    } catch (err) {
      error(err.response?.data?.detail || 'Failed to load student list for this exam paper.');
    } finally {
      setIsLoadingRoster(false);
    }
  }, [error, warning]);

  useEffect(() => {
    if (selectedScheduleId) {
      loadRoster(selectedScheduleId);
    }
  }, [selectedScheduleId, loadRoster]);

  const handleMarkChange = (studentId, value) => {
    const numericVal = parseFloat(value) || 0.0;
    setStudentMarks((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, marks_obtained: numericVal } : s))
    );
  };

  const handleRemarksChange = (studentId, value) => {
    setStudentMarks((prev) =>
      prev.map((s) => (s.student_id === studentId ? { ...s, remarks: value } : s))
    );
  };

  const triggerSave = (type) => {
    setActionType(type);
    setIsConfirmOpen(true);
  };

  const handleSaveMarks = async () => {
    if (!selectedScheduleId || studentMarks.length === 0) return;

    setIsSubmitting(true);
    try {
      const payload = {
        exam_schedule_id: parseInt(selectedScheduleId),
        is_finalized: actionType === 'finalize',
        marks: studentMarks.map((s) => ({
          student_id: s.student_id,
          marks_obtained: parseFloat(s.marks_obtained) || 0.0,
          remarks: s.remarks?.trim() || null,
        })),
      };

      await examService.bulkSaveMarks(payload);
      success(
        actionType === 'finalize'
          ? `Marks finalized for ${studentMarks.length} students.`
          : `Marks draft saved for ${studentMarks.length} students.`
      );
      setIsFinalized(actionType === 'finalize');
      setIsConfirmOpen(false);
      loadRoster(selectedScheduleId);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save marks.';
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExams) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading examination records..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Award className="w-6 h-6 text-brand-400" />
            <span>Enter Examination Marks</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Evaluate student examination papers, record obtained marks, and submit finalized scores.
          </p>
        </div>

        {studentMarks.length > 0 && !isFinalized && (
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              icon={Save}
              onClick={() => triggerSave('draft')}
              isLoading={isSubmitting}
            >
              Save Draft
            </Button>
            <Button
              variant="primary"
              icon={CheckCircle}
              onClick={() => triggerSave('finalize')}
              isLoading={isSubmitting}
            >
              Finalize & Submit
            </Button>
          </div>
        )}
      </div>

      {/* Select Exam & Subject Bar */}
      <Card bodyClassName="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Examination Session"
            options={exams.map((e) => ({
              value: e.id.toString(),
              label: `${e.name} (${e.exam_type})`,
            }))}
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
          />

          <Select
            label="Subject Paper"
            options={schedules.map((s) => ({
              value: s.id.toString(),
              label: `${s.subject?.code} - ${s.subject?.name} (Max: ${s.max_marks} | Pass: ${s.passing_marks})`,
            }))}
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            disabled={schedules.length === 0}
          />
        </div>
      </Card>

      {/* Finalized Banner if Locked */}
      {isFinalized && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center space-x-3">
          <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <strong className="font-bold text-emerald-200">Marks Finalized & Locked:</strong> This evaluation paper has been submitted to the administration. Contact the exam coordinator if a correction is needed.
          </div>
        </div>
      )}

      {/* Marks Entry Table */}
      <Card bodyClassName="p-0">
        {isLoadingRoster ? (
          <div className="p-12 flex justify-center">
            <Spinner size="md" label="Loading student roster..." />
          </div>
        ) : studentMarks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No enrolled students found for this subject examination.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm">
              <thead className="bg-slate-900/80 text-xs font-semibold text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Roll #</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3 text-center">Max Marks</th>
                  <th className="px-4 py-3 text-center">Obtained Marks</th>
                  <th className="px-4 py-3 text-center">Grade Preview</th>
                  <th className="px-4 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-xs">
                {studentMarks.map((s) => {
                  const maxM = rosterData?.max_marks || 100;
                  const marks = parseFloat(s.marks_obtained) || 0.0;
                  const pct = (marks / maxM) * 100;
                  const isPass = marks >= (rosterData?.passing_marks || 40);

                  return (
                    <tr key={s.student_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-brand-400">
                        {s.roll_number}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-white font-semibold">{s.first_name} {s.last_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{s.enrollment_number}</div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-300 font-mono font-bold">
                        {maxM}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={maxM}
                          value={s.marks_obtained}
                          onChange={(e) => handleMarkChange(s.student_id, e.target.value)}
                          disabled={isFinalized}
                          className="w-24 text-center font-mono font-bold rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-white focus:outline-none focus:border-brand-500 disabled:opacity-60"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={isPass ? 'success' : 'danger'} size="sm" className="font-mono">
                          {pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : pct >= 40 ? 'D' : 'F'} ({pct.toFixed(0)}%)
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          placeholder="Optional remarks..."
                          value={s.remarks || ''}
                          onChange={(e) => handleRemarksChange(s.student_id, e.target.value)}
                          disabled={isFinalized}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleSaveMarks}
        title={actionType === 'finalize' ? 'Finalize & Submit Marks' : 'Save Marks Draft'}
        message={
          actionType === 'finalize'
            ? 'Are you sure you want to finalize these marks? Once submitted, marks cannot be modified without administrative authorization.'
            : 'Save current evaluation draft? You can continue editing later.'
        }
        confirmText={actionType === 'finalize' ? 'Confirm Finalize' : 'Save Draft'}
        isLoading={isSubmitting}
      />
    </div>
  );
};
