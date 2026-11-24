import React, { useState, useEffect, useCallback } from 'react';
import { semesterService, sectionService, courseService, sessionService } from '../../services/academic.service';
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
  Layers,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  Users,
  Calendar,
  BookOpen,
} from 'lucide-react';

export const SemestersSectionsManagement = () => {
  const [activeTab, setActiveTab] = useState('semesters'); // 'semesters' | 'sections'

  // Dependencies
  const [courses, setCourses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedSessionFilter, setSelectedSessionFilter] = useState('');
  const [selectedSemesterFilter, setSelectedSemesterFilter] = useState('');

  // Semester Modal State
  const [isSemesterModalOpen, setIsSemesterModalOpen] = useState(false);
  const [isEditingSemester, setIsEditingSemester] = useState(false);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semCourseId, setSemCourseId] = useState('');
  const [semSessionId, setSemSessionId] = useState('');
  const [semNumber, setSemNumber] = useState('1');
  const [semName, setSemName] = useState('');
  const [semStartDate, setSemStartDate] = useState('');
  const [semEndDate, setSemEndDate] = useState('');

  // Section Modal State
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [isEditingSection, setIsEditingSection] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [secSemesterId, setSecSemesterId] = useState('');
  const [secName, setSecName] = useState('');
  const [secCapacity, setSecCapacity] = useState('60');

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'semester' | 'section'
  const [isDeleting, setIsDeleting] = useState(false);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const [crsList, sessList] = await Promise.all([
        courseService.getAll(),
        sessionService.getAll(),
      ]);
      setCourses(crsList);
      setSessions(sessList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  }, []);

  const fetchSemesters = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await semesterService.getAll({
        course_id: selectedCourseFilter ? parseInt(selectedCourseFilter) : undefined,
        academic_session_id: selectedSessionFilter ? parseInt(selectedSessionFilter) : undefined,
      });
      setSemesters(data);
    } catch (err) {
      error('Failed to load semesters.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseFilter, selectedSessionFilter, error]);

  const fetchSections = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sectionService.getAll({
        semester_id: selectedSemesterFilter ? parseInt(selectedSemesterFilter) : undefined,
      });
      setSections(data);
    } catch (err) {
      error('Failed to load sections.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedSemesterFilter, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    if (activeTab === 'semesters') {
      fetchSemesters();
    } else {
      fetchSections();
    }
  }, [activeTab, fetchSemesters, fetchSections]);

  // Semester Modal Handlers
  const openCreateSemesterModal = () => {
    setIsEditingSemester(false);
    setSelectedSemester(null);
    setSemCourseId(courses.length > 0 ? courses[0].id.toString() : '');
    setSemSessionId(sessions.length > 0 ? sessions[0].id.toString() : '');
    setSemNumber('1');
    setSemName('Semester 1');
    setSemStartDate('');
    setSemEndDate('');
    setFormError('');
    setIsSemesterModalOpen(true);
  };

  const openEditSemesterModal = (sem) => {
    setIsEditingSemester(true);
    setSelectedSemester(sem);
    setSemCourseId(sem.course_id.toString());
    setSemSessionId(sem.academic_session_id.toString());
    setSemNumber(sem.semester_number.toString());
    setSemName(sem.name);
    setSemStartDate(sem.start_date || '');
    setSemEndDate(sem.end_date || '');
    setFormError('');
    setIsSemesterModalOpen(true);
  };

  const handleSemesterSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!semCourseId || !semSessionId || !semNumber || !semName.trim()) {
      setFormError('Please fill in all required semester details.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        course_id: parseInt(semCourseId),
        academic_session_id: parseInt(semSessionId),
        semester_number: parseInt(semNumber),
        name: semName.trim(),
        start_date: semStartDate || null,
        end_date: semEndDate || null,
      };

      if (isEditingSemester && selectedSemester) {
        await semesterService.update(selectedSemester.id, payload);
        success(`Semester '${semName}' updated successfully.`);
      } else {
        await semesterService.create(payload);
        success(`Semester '${semName}' created successfully.`);
      }
      setIsSemesterModalOpen(false);
      fetchSemesters();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save semester.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Section Modal Handlers
  const openCreateSectionModal = () => {
    setIsEditingSection(false);
    setSelectedSection(null);
    setSecSemesterId(semesters.length > 0 ? semesters[0].id.toString() : '');
    setSecName('A');
    setSecCapacity('60');
    setFormError('');
    setIsSectionModalOpen(true);
  };

  const openEditSectionModal = (sec) => {
    setIsEditingSection(true);
    setSelectedSection(sec);
    setSecSemesterId(sec.semester_id.toString());
    setSecName(sec.name);
    setSecCapacity(sec.capacity.toString());
    setFormError('');
    setIsSectionModalOpen(true);
  };

  const handleSectionSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!secSemesterId || !secName.trim()) {
      setFormError('Please select semester and provide section name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        semester_id: parseInt(secSemesterId),
        name: secName.trim().toUpperCase(),
        capacity: parseInt(secCapacity) || 60,
      };

      if (isEditingSection && selectedSection) {
        await sectionService.update(selectedSection.id, payload);
        success(`Section '${secName}' updated.`);
      } else {
        await sectionService.create(payload);
        success(`Section '${secName}' created.`);
      }
      setIsSectionModalOpen(false);
      fetchSections();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save section.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      if (deleteType === 'semester') {
        await semesterService.delete(itemToDelete.id);
        success(`Semester '${itemToDelete.name}' deleted.`);
        fetchSemesters();
      } else {
        await sectionService.delete(itemToDelete.id);
        success(`Section '${itemToDelete.name}' deleted.`);
        fetchSections();
      }
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete item with dependent records.';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const semesterColumns = [
    {
      header: 'Sem #',
      key: 'semester_number',
      render: (row) => (
        <Badge variant="primary" size="sm" className="font-mono font-bold">
          SEM {row.semester_number}
        </Badge>
      ),
    },
    {
      header: 'Semester Name',
      key: 'name',
      render: (row) => <span className="font-bold text-white text-sm">{row.name}</span>,
    },
    {
      header: 'Course Program',
      key: 'course',
      render: (row) => <span className="text-slate-300 text-xs font-semibold">{row.course?.name}</span>,
    },
    {
      header: 'Academic Session',
      key: 'academic_session',
      render: (row) => <Badge variant="default" size="sm">{row.academic_session?.name}</Badge>,
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditSemesterModal(row)} className="p-1.5">
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setItemToDelete(row);
              setDeleteType('semester');
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5"
          >
            <Trash2 className="w-4 h-4 text-rose-400 hover:text-rose-300" />
          </Button>
        </div>
      ),
    },
  ];

  const sectionColumns = [
    {
      header: 'Section',
      key: 'name',
      render: (row) => (
        <Badge variant="success" size="sm" className="font-mono font-bold">
          SECTION {row.name}
        </Badge>
      ),
    },
    {
      header: 'Capacity',
      key: 'capacity',
      render: (row) => <span className="text-slate-300 text-xs">{row.capacity} Students</span>,
    },
    {
      header: 'Semester Association',
      key: 'semester',
      render: (row) => (
        <div>
          <div className="font-semibold text-white text-xs">{row.semester?.name}</div>
          <div className="text-[11px] text-slate-400">{row.semester?.course?.name}</div>
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditSectionModal(row)} className="p-1.5">
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setItemToDelete(row);
              setDeleteType('section');
              setIsDeleteDialogOpen(true);
            }}
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
            <Layers className="w-6 h-6 text-brand-400" />
            <span>Semesters & Sections</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Structure academic semester levels and lecture section divisions.
          </p>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={activeTab === 'semesters' ? openCreateSemesterModal : openCreateSectionModal}
        >
          {activeTab === 'semesters' ? 'Add Semester' : 'Add Section'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab('semesters')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'semesters'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Semesters ({semesters.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('sections')}
          className={`pb-3 text-sm font-semibold transition-all border-b-2 flex items-center space-x-2 ${
            activeTab === 'sections'
              ? 'border-brand-500 text-brand-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Sections ({sections.length})</span>
        </button>
      </div>

      {/* Filter Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {activeTab === 'semesters' ? (
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
              <div className="w-full sm:w-64">
                <Select
                  options={[
                    { value: '', label: 'All Courses' },
                    ...courses.map((c) => ({ value: c.id.toString(), label: c.name })),
                  ]}
                  value={selectedCourseFilter}
                  onChange={(e) => setSelectedCourseFilter(e.target.value)}
                />
              </div>
              <div className="w-full sm:w-64">
                <Select
                  options={[
                    { value: '', label: 'All Sessions' },
                    ...sessions.map((s) => ({ value: s.id.toString(), label: s.name })),
                  ]}
                  value={selectedSessionFilter}
                  onChange={(e) => setSelectedSessionFilter(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="w-full sm:w-80">
              <Select
                options={[
                  { value: '', label: 'All Semesters' },
                  ...semesters.map((s) => ({ value: s.id.toString(), label: `${s.name} (${s.course?.code})` })),
                ]}
                value={selectedSemesterFilter}
                onChange={(e) => setSelectedSemesterFilter(e.target.value)}
              />
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={RefreshCw}
            onClick={activeTab === 'semesters' ? fetchSemesters : fetchSections}
          >
            Refresh
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={activeTab === 'semesters' ? semesterColumns : sectionColumns}
          data={activeTab === 'semesters' ? semesters : sections}
          isLoading={isLoading}
          emptyMessage={`No ${activeTab} found.`}
        />
      </Card>

      {/* Create / Edit Semester Modal */}
      <Modal
        isOpen={isSemesterModalOpen}
        onClose={() => setIsSemesterModalOpen(false)}
        title={isEditingSemester ? 'Edit Semester' : 'Create New Semester'}
      >
        <form onSubmit={handleSemesterSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Select
            label="Course Program"
            options={courses.map((c) => ({ value: c.id.toString(), label: `${c.code} - ${c.name}` }))}
            value={semCourseId}
            onChange={(e) => setSemCourseId(e.target.value)}
            required
          />

          <Select
            label="Academic Session"
            options={sessions.map((s) => ({ value: s.id.toString(), label: `${s.name}${s.is_current ? ' (Current)' : ''}` }))}
            value={semSessionId}
            onChange={(e) => setSemSessionId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Semester Number"
              type="number"
              min="1"
              max="12"
              value={semNumber}
              onChange={(e) => {
                setSemNumber(e.target.value);
                setSemName(`Semester ${e.target.value}`);
              }}
              required
            />
            <Input
              label="Semester Display Name"
              placeholder="e.g. Semester 1"
              value={semName}
              onChange={(e) => setSemName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={semStartDate}
              onChange={(e) => setSemStartDate(e.target.value)}
            />
            <Input
              label="End Date"
              type="date"
              value={semEndDate}
              onChange={(e) => setSemEndDate(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsSemesterModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditingSemester ? 'Update Semester' : 'Create Semester'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create / Edit Section Modal */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={isEditingSection ? 'Edit Section' : 'Create New Section'}
      >
        <form onSubmit={handleSectionSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Select
            label="Belongs to Semester"
            options={semesters.map((s) => ({ value: s.id.toString(), label: `${s.name} - ${s.course?.name}` }))}
            value={secSemesterId}
            onChange={(e) => setSecSemesterId(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Section Name"
              placeholder="e.g. A, B, C"
              value={secName}
              onChange={(e) => setSecName(e.target.value)}
              required
              autoFocus
            />
            <Input
              label="Max Capacity"
              type="number"
              min="10"
              max="200"
              value={secCapacity}
              onChange={(e) => setSecCapacity(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsSectionModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditingSection ? 'Update Section' : 'Create Section'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`Delete ${deleteType === 'semester' ? 'Semester' : 'Section'}`}
        message={`Are you sure you want to delete '${itemToDelete?.name}'?`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
