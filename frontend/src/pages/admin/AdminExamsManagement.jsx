import React, { useState, useEffect, useCallback } from 'react';
import { examService } from '../../services/exam.service';
import { sessionService, semesterService, subjectService } from '../../services/academic.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  Award,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  Calendar,
  BookOpen,
  HelpCircle,
  Layers,
  FileCheck,
} from 'lucide-react';

const EXAM_TYPES = [
  { value: 'MID_TERM', label: 'Mid Semester Examination' },
  { value: 'END_TERM', label: 'End Semester Examination' },
  { value: 'INTERNAL', label: 'Internal Assessment' },
  { value: 'PRACTICAL', label: 'Practical Examination' },
  { value: 'VIVA', label: 'Viva Voce' },
  { value: 'OTHER', label: 'Other Assessment' },
];

export const AdminExamsManagement = () => {
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradesScale, setGradesScale] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');

  // Exam Modal State
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isEditingExam, setIsEditingExam] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [name, setName] = useState('');
  const [examType, setExamType] = useState('MID_TERM');
  const [sessionId, setSessionId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [examError, setExamError] = useState('');
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // Schedules Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [activeExamForSchedule, setActiveExamForSchedule] = useState(null);
  const [subjectId, setSubjectId] = useState('');
  const [examDate, setExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('13:00');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [roomNumber, setRoomNumber] = useState('LH-101');
  const [scheduleError, setScheduleError] = useState('');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Grading Scale Modal
  const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const [sessList, semList, subList, scaleList] = await Promise.all([
        sessionService.getAll(),
        semesterService.getAll(),
        subjectService.getAll(),
        examService.getGradesScale(),
      ]);
      setSessions(sessList);
      setSemesters(semList);
      setSubjects(subList);
      setGradesScale(scaleList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  }, []);

  const fetchExams = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await examService.getExams({
        academic_session_id: selectedSessionFilter ? parseInt(selectedSessionFilter) : undefined,
        exam_type: selectedTypeFilter || undefined,
      });
      setExams(data);
    } catch (err) {
      error('Failed to load examinations.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSessionFilter, selectedTypeFilter, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const openCreateExamModal = () => {
    setIsEditingExam(false);
    setSelectedExam(null);
    setName('Mid-Term Examination Fall 2025');
    setExamType('MID_TERM');
    setSessionId(sessions.length > 0 ? sessions[0].id.toString() : '');
    setSemesterId(semesters.length > 0 ? semesters[0].id.toString() : '');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0]);
    setDescription('');
    setExamError('');
    setIsExamModalOpen(true);
  };

  const openEditExamModal = (ex) => {
    setIsEditingExam(true);
    setSelectedExam(ex);
    setName(ex.name);
    setExamType(ex.exam_type);
    setSessionId(ex.academic_session_id.toString());
    setSemesterId(ex.semester_id.toString());
    setStartDate(ex.start_date);
    setEndDate(ex.end_date);
    setDescription(ex.description || '');
    setExamError('');
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e) => {
    e.preventDefault();
    setExamError('');

    if (!name.trim() || !sessionId || !semesterId || !startDate || !endDate) {
      setExamError('Exam Name, Session, Semester, and Date range are required.');
      return;
    }

    setIsSubmittingExam(true);
    try {
      const payload = {
        name: name.trim(),
        exam_type: examType,
        academic_session_id: parseInt(sessionId),
        semester_id: parseInt(semesterId),
        start_date: startDate,
        end_date: endDate,
        description: description.trim() || null,
        is_published: false,
      };

      if (isEditingExam && selectedExam) {
        await examService.updateExam(selectedExam.id, payload);
        success('Examination details updated.');
      } else {
        await examService.createExam(payload);
        success(`Examination '${name}' scheduled.`);
      }
      setIsExamModalOpen(false);
      fetchExams();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save examination.';
      setExamError(msg);
      error(msg);
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const togglePublish = async (ex) => {
    try {
      if (ex.is_published) {
        await examService.unpublishExam(ex.id);
        success(`Results for '${ex.name}' unpublished.`);
      } else {
        await examService.publishExam(ex.id);
        success(`Results for '${ex.name}' published to students.`);
      }
      fetchExams();
    } catch (err) {
      error('Failed to update publishing status.');
    }
  };

  // Open Schedules Modal
  const openScheduleModal = async (ex) => {
    try {
      const details = await examService.getExamById(ex.id);
      setActiveExamForSchedule(details);
      setSubjectId(subjects.length > 0 ? subjects[0].id.toString() : '');
      setExamDate(details.start_date);
      setStartTime('10:00');
      setEndTime('13:00');
      setMaxMarks('100');
      setPassingMarks('40');
      setRoomNumber('LH-101');
      setScheduleError('');
      setIsScheduleModalOpen(true);
    } catch (err) {
      error('Failed to load exam schedules.');
    }
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    setScheduleError('');

    if (!subjectId || !examDate || !startTime || !endTime) {
      setScheduleError('Subject, Exam Date, and Timing are required.');
      return;
    }

    setIsSubmittingSchedule(true);
    try {
      const payload = {
        exam_id: activeExamForSchedule.id,
        subject_id: parseInt(subjectId),
        exam_date: examDate,
        start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
        end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
        max_marks: parseInt(maxMarks) || 100,
        passing_marks: parseInt(passingMarks) || 40,
        room_number: roomNumber.trim() || null,
      };

      await examService.addSchedule(activeExamForSchedule.id, payload);
      success('Subject added to examination schedule.');
      const updated = await examService.getExamById(activeExamForSchedule.id);
      setActiveExamForSchedule(updated);
      fetchExams();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to add exam subject.';
      setScheduleError(msg);
      error(msg);
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await examService.deleteSchedule(scheduleId);
      success('Subject removed from examination schedule.');
      const updated = await examService.getExamById(activeExamForSchedule.id);
      setActiveExamForSchedule(updated);
      fetchExams();
    } catch (err) {
      error('Failed to remove subject from schedule.');
    }
  };

  const handleDelete = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
      await examService.deleteExam(examToDelete.id);
      success(`Examination '${examToDelete.name}' deleted.`);
      setIsDeleteDialogOpen(false);
      setExamToDelete(null);
      fetchExams();
    } catch (err) {
      error('Failed to delete examination.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Examination Name & Type',
      key: 'name',
      render: (row) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm">{row.name}</span>
            <Badge variant="primary" size="sm">{row.exam_type}</Badge>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {row.academic_session?.name} • {row.semester?.name}
          </div>
        </div>
      ),
    },
    {
      header: 'Date Window',
      key: 'dates',
      render: (row) => (
        <div className="text-xs text-slate-300 font-mono">
          {row.start_date} → {row.end_date}
        </div>
      ),
    },
    {
      header: 'Curriculum Subjects',
      key: 'subjects_count',
      render: (row) => (
        <Badge variant="cyan" size="sm">
          {row.schedules?.length || 0} Subjects Scheduled
        </Badge>
      ),
    },
    {
      header: 'Status & Visibility',
      key: 'status',
      render: (row) => (
        <div className="flex items-center space-x-2">
          <Badge variant={row.is_published ? 'success' : 'default'} size="sm">
            {row.is_published ? 'PUBLISHED' : 'DRAFT / UNPUBLISHED'}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="text-[10px] py-0.5 px-2"
            onClick={() => togglePublish(row)}
          >
            {row.is_published ? 'Unpublish' : 'Publish Results'}
          </Button>
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openScheduleModal(row)}
            className="p-1.5"
            title="Configure Exam Subjects"
          >
            <BookOpen className="w-4 h-4 text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditExamModal(row)}
            className="p-1.5"
            title="Edit Exam"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setExamToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5"
            title="Delete Exam"
          >
            <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-300" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Award className="w-6 h-6 text-brand-400" />
            <span>Examinations, Marks & Results Control</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure examination schedules, subject weightages, grading scale, and publish official report cards.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="secondary" icon={HelpCircle} onClick={() => setIsGradeModalOpen(true)}>
            Grading Scale
          </Button>
          <Button variant="primary" icon={Plus} onClick={openCreateExamModal}>
            Create Examination
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: '', label: 'All Academic Sessions' },
                  ...sessions.map((s) => ({ value: s.id.toString(), label: s.name })),
                ]}
                value={selectedSessionFilter}
                onChange={(e) => setSelectedSessionFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: '', label: 'All Exam Types' },
                  ...EXAM_TYPES,
                ]}
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchExams}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Examinations Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={exams}
          isLoading={isLoading}
          emptyMessage="No examinations configured."
        />
      </Card>

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        title={isEditingExam ? 'Edit Examination' : 'Create Examination'}
        subtitle="Configure assessment term, type, and dates"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          {examError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {examError}
            </div>
          )}

          <Input
            label="Examination Name"
            placeholder="e.g. End Semester Examination Spring 2025"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Exam Type"
              options={EXAM_TYPES}
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              required
            />
            <Select
              label="Academic Session"
              options={sessions.map((s) => ({ value: s.id.toString(), label: s.name }))}
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
            />
            <Select
              label="Semester"
              options={semesters.map((sem) => ({ value: sem.id.toString(), label: `${sem.course?.code || ''} - ${sem.name}` }))}
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Description / Special Instructions"
            placeholder="e.g. Standard 3-hour theoretical and laboratory examinations"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsExamModalOpen(false)} disabled={isSubmittingExam}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingExam}>
              {isEditingExam ? 'Update Examination' : 'Save Examination'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Exam Schedules Modal */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={`Exam Subjects Schedule: ${activeExamForSchedule?.name || ''}`}
        subtitle="Manage subject papers, max marks, passing criteria, and dates"
      >
        <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
          {/* Add Subject Form */}
          <form onSubmit={handleAddSchedule} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-400 flex items-center space-x-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject Paper</span>
            </h4>
            {scheduleError && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {scheduleError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Subject"
                options={subjects.map((s) => ({ value: s.id.toString(), label: `${s.code} - ${s.name} (${s.credits} Cr)` }))}
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              />
              <Input
                label="Exam Date"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
              <Input
                label="Max Marks"
                type="number"
                value={maxMarks}
                onChange={(e) => setMaxMarks(e.target.value)}
                required
              />
              <Input
                label="Passing Marks"
                type="number"
                value={passingMarks}
                onChange={(e) => setPassingMarks(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingSchedule}>
                Add to Exam
              </Button>
            </div>
          </form>

          {/* Current Scheduled Subjects List */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Scheduled Subject Papers ({activeExamForSchedule?.schedules?.length || 0})
            </h4>
            {activeExamForSchedule?.schedules?.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No subject papers scheduled yet.</p>
            ) : (
              <div className="space-y-2">
                {activeExamForSchedule?.schedules?.map((sch) => (
                  <div
                    key={sch.id}
                    className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-white">{sch.subject?.code} - {sch.subject?.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {sch.exam_date} • {sch.start_time?.substring(0, 5)} - {sch.end_time?.substring(0, 5)} • Max: {sch.max_marks} | Pass: {sch.passing_marks}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSchedule(sch.id)}
                      className="p-1 text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsScheduleModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Grading Scale Modal */}
      <Modal
        isOpen={isGradeModalOpen}
        onClose={() => setIsGradeModalOpen(false)}
        title="Institutional Grading Scale & SGPA Standard"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-300 leading-relaxed">
            Grades and Grade Points are dynamically derived from source marks using the centralized evaluation engine:
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold">
                <tr>
                  <th className="px-3 py-2">Grade</th>
                  <th className="px-3 py-2">Percentage Range</th>
                  <th className="px-3 py-2">Grade Point</th>
                  <th className="px-3 py-2">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {gradesScale.map((g) => (
                  <tr key={g.grade}>
                    <td className="px-3 py-2 font-mono font-bold text-brand-400">{g.grade}</td>
                    <td className="px-3 py-2 text-white">≥ {g.min_percentage}%</td>
                    <td className="px-3 py-2 font-mono text-emerald-400 font-bold">{g.grade_point.toFixed(1)}</td>
                    <td className="px-3 py-2 text-slate-300">{g.description} ({g.status})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            <strong className="text-white">SGPA Calculation Formula:</strong>
            <p className="font-mono text-brand-300 text-[11px] mt-1">
              SGPA = Σ (Subject Credits × Grade Point) / Σ (Subject Credits)
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" onClick={() => setIsGradeModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Exam Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Examination"
        message={`Are you sure you want to delete '${examToDelete?.name}'? All scheduled papers and uploaded marks will be removed.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
