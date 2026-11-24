import React, { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../../services/assignment.service';
import { facultyService } from '../../services/faculty.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Eye,
  CheckCircle,
  Clock,
  Download,
  Award,
  Users,
  Lock,
  BookOpen,
  Send,
  Sparkles,
} from 'lucide-react';

export const FacultyAssignmentsManagement = () => {
  const [assignments, setAssignments] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedAllocationFilter, setSelectedAllocationFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Create/Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [allocationId, setAllocationId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
  const [maxPoints, setMaxPoints] = useState('100');
  const [allowLate, setAllowLate] = useState(true);
  const [maxAttempts, setMaxAttempts] = useState('1');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Submissions Modal State
  const [isSubmissionsModalOpen, setIsSubmissionsModalOpen] = useState(false);
  const [activeAssignmentForSubs, setActiveAssignmentForSubs] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);

  // Grading Modal State
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [obtainedMarks, setObtainedMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const allocList = await facultyService.getMyAllocations();
      setAllocations(allocList);
    } catch (err) {
      console.error('Failed to load faculty allocations:', err);
    }
  }, []);

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAssignments({
        subject_allocation_id: selectedAllocationFilter ? parseInt(selectedAllocationFilter) : undefined,
        status_filter: selectedStatusFilter || undefined,
      });
      setAssignments(data);
    } catch (err) {
      error('Failed to load assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedAllocationFilter, selectedStatusFilter, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedAssignment(null);
    setAllocationId(allocations.length > 0 ? allocations[0].id.toString() : '');
    setTitle('Coursework Assignment 1: Problem Set');
    setDescription('Complete the practical implementation and theoretical proofs.');
    setInstructions('Submit a single PDF or ZIP archive with your roll number in filename.');
    setDueDate(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16));
    setMaxPoints('100');
    setAllowLate(true);
    setMaxAttempts('1');
    setAttachmentName('');
    setAttachmentUrl('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (asg) => {
    setIsEditing(true);
    setSelectedAssignment(asg);
    setAllocationId(asg.subject_allocation_id.toString());
    setTitle(asg.title);
    setDescription(asg.description);
    setInstructions(asg.instructions || '');
    setDueDate(new Date(asg.due_date).toISOString().slice(0, 16));
    setMaxPoints(asg.max_points.toString());
    setAllowLate(asg.allow_late_submission);
    setMaxAttempts(asg.max_attempts.toString());
    setAttachmentName(asg.attachment_name || '');
    setAttachmentUrl(asg.attachment_url || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!allocationId || !title.trim() || !description.trim() || !dueDate) {
      setFormError('Subject Allocation, Title, Description, and Due Date are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        subject_allocation_id: parseInt(allocationId),
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim() || null,
        due_date: new Date(dueDate).toISOString(),
        max_points: parseInt(maxPoints) || 100,
        status: 'PUBLISHED',
        allow_late_submission: allowLate,
        max_attempts: parseInt(maxAttempts) || 1,
        attachment_name: attachmentName.trim() || null,
        attachment_url: attachmentUrl.trim() || null,
      };

      if (isEditing && selectedAssignment) {
        await assignmentService.updateAssignment(selectedAssignment.id, payload);
        success('Assignment updated successfully.');
      } else {
        await assignmentService.createAssignment(payload);
        success(`Assignment '${title}' published to students.`);
      }
      setIsModalOpen(false);
      fetchAssignments();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save assignment.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openSubmissionsModal = async (asg) => {
    setActiveAssignmentForSubs(asg);
    setIsSubmissionsModalOpen(true);
    setIsLoadingSubs(true);
    try {
      const [subsList, statsData] = await Promise.all([
        assignmentService.getSubmissions(asg.id),
        assignmentService.getAssignmentStats(asg.id),
      ]);
      setSubmissions(subsList);
      setStats(statsData);
    } catch (err) {
      error('Failed to load submissions.');
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const openGradingModal = (sub) => {
    setSelectedSubmission(sub);
    setObtainedMarks(sub.obtained_marks ? sub.obtained_marks.toString() : '');
    setFeedback(sub.feedback || '');
    setIsGradingModalOpen(true);
  };

  const handleSaveGrade = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;

    setIsSubmittingGrade(true);
    try {
      const marksVal = parseFloat(obtainedMarks);
      await assignmentService.gradeSubmission(selectedSubmission.id, {
        obtained_marks: marksVal,
        feedback: feedback.trim() || null,
        status: 'GRADED',
      });
      success('Submission graded successfully.');
      setIsGradingModalOpen(false);
      // Reload submissions
      const [subsList, statsData] = await Promise.all([
        assignmentService.getSubmissions(activeAssignmentForSubs.id),
        assignmentService.getAssignmentStats(activeAssignmentForSubs.id),
      ]);
      setSubmissions(subsList);
      setStats(statsData);
      fetchAssignments();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to grade submission.';
      error(msg);
    } finally {
      setIsSubmittingGrade(false);
    }
  };

  const handleDelete = async () => {
    if (!assignmentToDelete) return;
    setIsDeleting(true);
    try {
      await assignmentService.deleteAssignment(assignmentToDelete.id);
      success(`Assignment '${assignmentToDelete.title}' deleted.`);
      setIsDeleteDialogOpen(false);
      setAssignmentToDelete(null);
      fetchAssignments();
    } catch (err) {
      error('Failed to delete assignment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Assignment Title & Subject',
      key: 'title',
      render: (row) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-sm">{row.title}</span>
            <Badge variant="primary" size="sm">Sec {row.allocation?.section?.name}</Badge>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {row.allocation?.subject?.code} - {row.allocation?.subject?.name}
          </div>
        </div>
      ),
    },
    {
      header: 'Due Date',
      key: 'due_date',
      render: (row) => {
        const isPast = new Date(row.due_date) < new Date();
        return (
          <div className="text-xs">
            <div className={`font-mono font-bold ${isPast ? 'text-amber-400' : 'text-slate-300'}`}>
              {new Date(row.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
            </div>
            <div className="text-[11px] text-slate-500">Max Points: {row.max_points}</div>
          </div>
        );
      },
    },
    {
      header: 'Submission Progress',
      key: 'submissions',
      render: (row) => (
        <div>
          <Badge variant="cyan" size="sm" className="font-mono">
            {row.total_submissions_count} Submissions
          </Badge>
          <div className="text-[11px] text-emerald-400 mt-0.5 font-semibold">
            {row.graded_submissions_count} Graded
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge
          variant={
            row.status === 'PUBLISHED'
              ? 'success'
              : row.status === 'CLOSED'
              ? 'danger'
              : 'default'
          }
          size="sm"
        >
          {row.status}
        </Badge>
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
            variant="secondary"
            size="sm"
            onClick={() => openSubmissionsModal(row)}
            className="text-xs py-1 px-2.5"
            icon={Eye}
          >
            Review ({row.total_submissions_count})
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            className="p-1.5"
            title="Edit Assignment"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAssignmentToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5"
            title="Delete Assignment"
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
            <FileText className="w-6 h-6 text-brand-400" />
            <span>Assignments & Coursework Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Create homework tasks, manage deadlines, review student submissions, and submit feedback.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Create Assignment
        </Button>
      </div>

      {/* Filter Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="w-full sm:w-72">
              <Select
                options={[
                  { value: '', label: 'All Assigned Classes' },
                  ...allocations.map((a) => ({
                    value: a.id.toString(),
                    label: `${a.subject?.code} - ${a.subject?.name} (Sec ${a.section?.name})`,
                  })),
                ]}
                value={selectedAllocationFilter}
                onChange={(e) => setSelectedAllocationFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'CLOSED', label: 'Closed' },
                ]}
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAssignments}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Assignments Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={assignments}
          isLoading={isLoading}
          emptyMessage="No assignments created yet."
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Assignment' : 'Create Coursework Assignment'}
        subtitle="Publish homework problem sets, projects, and lab exercises"
      >
        <form onSubmit={handleSaveAssignment} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Select
            label="Subject & Lecture Section"
            options={allocations.map((a) => ({
              value: a.id.toString(),
              label: `${a.subject?.code} - ${a.subject?.name} (Section ${a.section?.name})`,
            }))}
            value={allocationId}
            onChange={(e) => setAllocationId(e.target.value)}
            required
          />

          <Input
            label="Assignment Title"
            placeholder="e.g. Lab Exercise 2: Binary Search Trees"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Description & Problem Statement</label>
            <textarea
              rows={3}
              placeholder="Describe the task and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:outline-none focus:border-brand-500 text-xs"
              required
            />
          </div>

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Detailed Submission Instructions</label>
            <textarea
              rows={2}
              placeholder="Format requirements, packaging guidelines..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Due Date & Time"
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
            <Input
              label="Maximum Points"
              type="number"
              value={maxPoints}
              onChange={(e) => setMaxPoints(e.target.value)}
              required
            />
            <Input
              label="Allowed Attempts"
              type="number"
              min="1"
              max="5"
              value={maxAttempts}
              onChange={(e) => setMaxAttempts(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="allowLate"
              checked={allowLate}
              onChange={(e) => setAllowLate(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="allowLate" className="text-xs font-medium text-slate-300">
              Allow late submissions with penalty flag
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Assignment' : 'Publish Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Submissions & Grading Drawer/Modal */}
      <Modal
        isOpen={isSubmissionsModalOpen}
        onClose={() => setIsSubmissionsModalOpen(false)}
        title={`Submissions: ${activeAssignmentForSubs?.title || ''}`}
        subtitle={`Section ${activeAssignmentForSubs?.allocation?.section?.name || ''} • Max: ${activeAssignmentForSubs?.max_points || 100} Points`}
      >
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Quick Statistics Strip */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Total Enrolled</span>
                <div className="text-lg font-bold text-white">{stats.total_enrolled}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Submitted</span>
                <div className="text-lg font-bold text-emerald-400">{stats.submitted_count}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Graded</span>
                <div className="text-lg font-bold text-brand-400">{stats.graded_count}</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
                <span className="text-[10px] uppercase font-semibold text-slate-400">Avg Score</span>
                <div className="text-lg font-bold text-amber-300">{stats.average_marks}</div>
              </div>
            </div>
          )}

          {/* Submissions Table */}
          {isLoadingSubs ? (
            <div className="p-8 flex justify-center">
              <Spinner size="md" label="Loading student submissions..." />
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No students have submitted coursework for this assignment yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="px-3 py-2.5">Roll #</th>
                    <th className="px-3 py-2.5">Student Name</th>
                    <th className="px-3 py-2.5">Submitted At</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-center">Score</th>
                    <th className="px-3 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="px-3 py-2.5 font-mono font-bold text-brand-400">
                        {sub.student?.roll_number}
                      </td>
                      <td className="px-3 py-2.5 text-white font-semibold">
                        {sub.student?.first_name} {sub.student?.last_name}
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 font-mono">
                        {new Date(sub.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={
                            sub.status === 'GRADED'
                              ? 'success'
                              : sub.status === 'LATE'
                              ? 'danger'
                              : 'primary'
                          }
                          size="sm"
                        >
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold text-white">
                        {sub.obtained_marks !== null ? `${sub.obtained_marks} / ${activeAssignmentForSubs?.max_points}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          className="text-[11px] py-1 px-2.5"
                          onClick={() => openGradingModal(sub)}
                        >
                          {sub.status === 'GRADED' ? 'Edit Grade' : 'Grade'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsSubmissionsModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Grade Submission Modal */}
      <Modal
        isOpen={isGradingModalOpen}
        onClose={() => setIsGradingModalOpen(false)}
        title={`Grade: ${selectedSubmission?.student?.first_name} ${selectedSubmission?.student?.last_name}`}
        subtitle={`Roll #${selectedSubmission?.student?.roll_number} • Max Points: ${activeAssignmentForSubs?.max_points}`}
      >
        <form onSubmit={handleSaveGrade} className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Student Submission Text</span>
            <p className="text-white italic leading-relaxed">
              "{selectedSubmission?.submission_text || 'No submission comment attached.'}"
            </p>
            {selectedSubmission?.file_name && (
              <div className="flex items-center space-x-2 text-indigo-400 pt-1 text-xs">
                <FileText className="w-4 h-4" />
                <span className="font-mono font-bold">{selectedSubmission.file_name}</span>
              </div>
            )}
          </div>

          <Input
            label={`Obtained Marks (out of ${activeAssignmentForSubs?.max_points || 100})`}
            type="number"
            step="0.5"
            min="0"
            max={activeAssignmentForSubs?.max_points || 100}
            value={obtainedMarks}
            onChange={(e) => setObtainedMarks(e.target.value)}
            required
          />

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Instructor Feedback & Comments</label>
            <textarea
              rows={3}
              placeholder="Add constructive feedback..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsGradingModalOpen(false)} disabled={isSubmittingGrade}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingGrade}>
              Submit Grade
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Assignment Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Coursework Assignment"
        message={`Are you sure you want to delete '${assignmentToDelete?.title}'? All student submissions will be removed.`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
