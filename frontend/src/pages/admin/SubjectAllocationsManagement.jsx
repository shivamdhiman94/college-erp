import React, { useState, useEffect, useCallback } from 'react';
import { facultyService } from '../../services/faculty.service';
import {
  subjectService,
  sectionService,
  sessionService,
} from '../../services/academic.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  BookOpen,
  Plus,
  Trash2,
  RefreshCw,
  GraduationCap,
  Calendar,
  Layers,
} from 'lucide-react';

export const SubjectAllocationsManagement = () => {
  const [allocations, setAllocations] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sections, setSections] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facultyId, setFacultyId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [allocToDelete, setAllocToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const [facList, subList, secList, sessList] = await Promise.all([
        facultyService.getAll(),
        subjectService.getAll(),
        sectionService.getAll(),
        sessionService.getAll(),
      ]);
      setFacultyList(facList);
      setSubjects(subList);
      setSections(secList);
      setSessions(sessList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  }, []);

  const fetchAllocations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await facultyService.getAllAllocations({
        faculty_id: selectedFacultyFilter ? parseInt(selectedFacultyFilter) : undefined,
        academic_session_id: selectedSessionFilter ? parseInt(selectedSessionFilter) : undefined,
      });
      setAllocations(data);
    } catch (err) {
      error('Failed to load subject allocations.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFacultyFilter, selectedSessionFilter, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchAllocations();
  }, [fetchAllocations]);

  const openCreateModal = () => {
    setFacultyId(facultyList.length > 0 ? facultyList[0].id.toString() : '');
    setSubjectId(subjects.length > 0 ? subjects[0].id.toString() : '');
    setSectionId(sections.length > 0 ? sections[0].id.toString() : '');
    setSessionId(sessions.length > 0 ? sessions[0].id.toString() : '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!facultyId || !subjectId || !sectionId || !sessionId) {
      setFormError('Please select Faculty, Subject, Section, and Academic Session.');
      return;
    }

    setIsSubmitting(true);
    try {
      await facultyService.createAllocation({
        faculty_id: parseInt(facultyId),
        subject_id: parseInt(subjectId),
        section_id: parseInt(sectionId),
        academic_session_id: parseInt(sessionId),
        is_active: true,
      });
      success('Subject successfully assigned to faculty member.');
      setIsModalOpen(false);
      fetchAllocations();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to allocate subject.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!allocToDelete) return;
    setIsDeleting(true);
    try {
      await facultyService.deleteAllocation(allocToDelete.id);
      success('Subject assignment removed.');
      setIsDeleteDialogOpen(false);
      setAllocToDelete(null);
      fetchAllocations();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to remove allocation.';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Assigned Subject',
      key: 'subject',
      render: (row) => (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-brand-400 text-xs">{row.subject?.code}</span>
            <Badge variant="primary" size="sm">{row.subject?.type}</Badge>
          </div>
          <div className="font-bold text-white text-sm mt-0.5">{row.subject?.name}</div>
          <div className="text-[11px] text-slate-400">{row.subject?.course?.name}</div>
        </div>
      ),
    },
    {
      header: 'Faculty Member',
      key: 'faculty',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-sm">
            {row.faculty ? `${row.faculty.first_name} ${row.faculty.last_name}` : 'Faculty Member'}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            {row.faculty?.employee_code || `Faculty #${row.faculty_id}`}
          </div>
        </div>
      ),
    },
    {
      header: 'Section & Term',
      key: 'section',
      render: (row) => (
        <div>
          <Badge variant="success" size="sm" className="font-mono">
            Section {row.section?.name}
          </Badge>
          <div className="text-[11px] text-slate-400 mt-1">
            Session: {row.academic_session?.name}
          </div>
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAllocToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            title="Remove Assignment"
            className="p-1.5"
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
            <BookOpen className="w-6 h-6 text-brand-400" />
            <span>Faculty Subject Allocations</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Assign curriculum subjects and lecture sections to academic instructors.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Assign Subject
        </Button>
      </div>

      {/* Control Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="w-full sm:w-72">
              <Select
                options={[
                  { value: '', label: 'All Faculty Members' },
                  ...facultyList.map((f) => ({ value: f.id.toString(), label: `${f.first_name} ${f.last_name} (${f.employee_code})` })),
                ]}
                value={selectedFacultyFilter}
                onChange={(e) => setSelectedFacultyFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-60">
              <Select
                options={[
                  { value: '', label: 'All Academic Sessions' },
                  ...sessions.map((s) => ({ value: s.id.toString(), label: s.name })),
                ]}
                value={selectedSessionFilter}
                onChange={(e) => setSelectedSessionFilter(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchAllocations}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={allocations}
          isLoading={isLoading}
          emptyMessage="No faculty subject allocations found."
        />
      </Card>

      {/* Assign Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Subject to Faculty"
        subtitle="Allocate a teaching load for an academic term"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Select
            label="Faculty Instructor"
            options={facultyList.map((f) => ({
              value: f.id.toString(),
              label: `${f.first_name} ${f.last_name} (${f.designation} • ${f.department?.code})`,
            }))}
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            required
          />

          <Select
            label="Subject to Teach"
            options={subjects.map((s) => ({
              value: s.id.toString(),
              label: `${s.code} - ${s.name} (${s.credits} Credits • ${s.course?.code})`,
            }))}
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Lecture Section"
              options={sections.map((sec) => ({
                value: sec.id.toString(),
                label: `Section ${sec.name} (${sec.semester?.name})`,
              }))}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
            />
            <Select
              label="Academic Session"
              options={sessions.map((sess) => ({
                value: sess.id.toString(),
                label: `${sess.name}${sess.is_current ? ' (Current Active)' : ''}`,
              }))}
              value={sessionId}
              onChange={(e) => setSessionId(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm Allocation
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Remove Subject Allocation"
        message="Are you sure you want to remove this faculty teaching assignment?"
        confirmText="Remove Assignment"
        isLoading={isDeleting}
      />
    </div>
  );
};
