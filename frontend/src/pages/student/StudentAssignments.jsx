import React, { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../../services/assignment.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Spinner } from '../../components/common/Spinner';
import {
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  BookOpen,
  Send,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const StudentAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'
  const [isLoading, setIsLoading] = useState(true);

  // Submit Modal State
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [activeAssignment, setActiveAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [fileName, setFileName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { success, error } = useToast();

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getMyStudentAssignments();
      setAssignments(data);
    } catch (err) {
      error('Failed to load coursework assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const openSubmitModal = (asg) => {
    setActiveAssignment(asg);
    setSubmissionText('');
    setFileName(`${asg.subject_code.toLowerCase()}_solution.pdf`);
    setFormError('');
    setIsSubmitModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    if (!activeAssignment) return;
    if (!submissionText.trim() && !fileName.trim()) {
      setFormError('Please enter your submission text or attach a file.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        submission_text: submissionText.trim() || null,
        file_name: fileName.trim() || 'assignment_submission.pdf',
        file_url: `/uploads/assignments/${fileName.trim()}`,
        file_size: 15400,
      };

      await assignmentService.submitAssignment(activeAssignment.id, payload);
      success(`Coursework for '${activeAssignment.title}' submitted successfully.`);
      setIsConfirmOpen(false);
      setIsSubmitModalOpen(false);
      fetchAssignments();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit assignment.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (filter === 'PENDING') return !a.is_submitted;
    if (filter === 'SUBMITTED') return a.is_submitted && a.submission_status !== 'GRADED';
    if (filter === 'GRADED') return a.submission_status === 'GRADED';
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading coursework assignments..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
          <FileText className="w-6 h-6 text-brand-400" />
          <span>Coursework & Lab Assignments</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Review pending homework, submit solutions, and track grades with instructor feedback.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 border-b border-slate-800 pb-2">
        {[
          { id: 'ALL', label: `All Coursework (${assignments.length})` },
          { id: 'PENDING', label: `Pending (${assignments.filter((a) => !a.is_submitted).length})` },
          { id: 'SUBMITTED', label: `Submitted (${assignments.filter((a) => a.is_submitted && a.submission_status !== 'GRADED').length})` },
          { id: 'GRADED', label: `Graded (${assignments.filter((a) => a.submission_status === 'GRADED').length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              filter === tab.id
                ? 'bg-brand-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Coursework Cards Grid */}
      {filteredAssignments.length === 0 ? (
        <Card bodyClassName="p-12 text-center text-xs text-slate-400">
          No assignments found matching this filter.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredAssignments.map((asg) => {
            const isPastDue = new Date(asg.due_date) < new Date();
            return (
              <div
                key={asg.id}
                className="p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/40 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-brand-400 text-xs">
                      {asg.subject_code} • {asg.subject_name}
                    </span>
                    <Badge
                      variant={
                        asg.submission_status === 'GRADED'
                          ? 'success'
                          : asg.is_submitted
                          ? 'cyan'
                          : isPastDue
                          ? 'danger'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {asg.submission_status === 'GRADED'
                        ? 'GRADED'
                        : asg.is_submitted
                        ? 'SUBMITTED'
                        : isPastDue
                        ? 'OVERDUE'
                        : 'PENDING'}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{asg.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{asg.description}</p>
                  </div>

                  {asg.instructions && (
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300">
                      <strong className="text-slate-200">Instructions:</strong> {asg.instructions}
                    </div>
                  )}

                  {/* If Graded: Show Score & Feedback */}
                  {asg.submission_status === 'GRADED' && (
                    <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-300 flex items-center space-x-1.5">
                          <Award className="w-4 h-4" />
                          <span>Evaluation Score</span>
                        </span>
                        <span className="text-sm font-black text-emerald-400">
                          {asg.obtained_marks} / {asg.max_points} Points
                        </span>
                      </div>
                      {asg.feedback && (
                        <p className="text-emerald-200/90 text-[11px] italic pt-1 border-t border-emerald-500/20">
                          Feedback: "{asg.feedback}"
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1 font-mono text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {new Date(asg.due_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">Faculty: {asg.faculty_name}</div>
                  </div>

                  <div>
                    {!asg.is_submitted ? (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={Upload}
                        onClick={() => openSubmitModal(asg)}
                      >
                        Submit
                      </Button>
                    ) : asg.submission_status !== 'GRADED' && asg.attempt_number < asg.max_attempts ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openSubmitModal(asg)}
                      >
                        Resubmit ({asg.attempt_number}/{asg.max_attempts})
                      </Button>
                    ) : (
                      <Badge variant="success" size="sm" className="font-mono">
                        Turned In
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Assignment Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={`Submit: ${activeAssignment?.title || ''}`}
        subtitle={`${activeAssignment?.subject_code} • Maximum Points: ${activeAssignment?.max_points}`}
      >
        <div className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Submission Answer / Note</label>
            <textarea
              rows={3}
              placeholder="Describe your solution approach, methodology, or code details..."
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:outline-none focus:border-brand-500 text-xs"
            />
          </div>

          <Input
            label="Attached File Name"
            placeholder="e.g. lab_solution.zip"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            required
          />

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-3 text-slate-300">
            <Upload className="w-5 h-5 text-brand-400" />
            <div className="text-[11px]">
              Ready to upload: <strong className="text-white font-mono">{fileName}</strong>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon={Send} onClick={() => setIsConfirmOpen(true)}>
              Submit Coursework
            </Button>
          </div>
        </div>
      </Modal>

      {/* Submission Confirmation */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Confirm Assignment Submission"
        message="Are you sure you want to turn in this assignment?"
        confirmText="Confirm & Submit"
        isLoading={isSubmitting}
      />
    </div>
  );
};
