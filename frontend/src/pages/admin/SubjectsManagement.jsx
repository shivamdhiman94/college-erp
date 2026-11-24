import React, { useState, useEffect, useCallback } from 'react';
import { subjectService, courseService, departmentService } from '../../services/academic.service';
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
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export const SubjectsManagement = () => {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
  const [selectedSemFilter, setSelectedSemFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Form State
  const [courseId, setCourseId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [semesterNumber, setSemesterNumber] = useState('1');
  const [type, setType] = useState('THEORY');
  const [credits, setCredits] = useState('4.0');
  const [maxMarks, setMaxMarks] = useState('100');
  const [passingMarks, setPassingMarks] = useState('40');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const [crsList, deptList] = await Promise.all([
        courseService.getAll(),
        departmentService.getAll(),
      ]);
      setCourses(crsList);
      setDepartments(deptList);
    } catch (err) {
      console.error('Failed to load dependencies:', err);
    }
  }, []);

  const fetchSubjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await subjectService.getAll({
        course_id: selectedCourseFilter ? parseInt(selectedCourseFilter) : undefined,
        semester_number: selectedSemFilter ? parseInt(selectedSemFilter) : undefined,
        search: searchTerm || undefined,
      });
      setSubjects(data);
    } catch (err) {
      error('Failed to load subjects.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCourseFilter, selectedSemFilter, searchTerm, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchSubjects();
  }, [fetchSubjects]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedSubject(null);
    setCourseId(courses.length > 0 ? courses[0].id.toString() : '');
    setDepartmentId(departments.length > 0 ? departments[0].id.toString() : '');
    setCode('');
    setName('');
    setSemesterNumber('1');
    setType('THEORY');
    setCredits('4.0');
    setMaxMarks('100');
    setPassingMarks('40');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setIsEditing(true);
    setSelectedSubject(sub);
    setCourseId(sub.course_id.toString());
    setDepartmentId(sub.department_id.toString());
    setCode(sub.code);
    setName(sub.name);
    setSemesterNumber(sub.semester_number.toString());
    setType(sub.type);
    setCredits(sub.credits.toString());
    setMaxMarks(sub.max_marks.toString());
    setPassingMarks(sub.passing_marks.toString());
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!courseId || !departmentId || !code.trim() || !name.trim()) {
      setFormError('Course, Department, Subject Code, and Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        course_id: parseInt(courseId),
        department_id: parseInt(departmentId),
        code: code.trim().toUpperCase(),
        name: name.trim(),
        semester_number: parseInt(semesterNumber) || 1,
        type: type,
        credits: parseFloat(credits) || 4.0,
        max_marks: parseInt(maxMarks) || 100,
        passing_marks: parseInt(passingMarks) || 40,
      };

      if (isEditing && selectedSubject) {
        await subjectService.update(selectedSubject.id, payload);
        success(`Subject '${name}' updated.`);
      } else {
        await subjectService.create(payload);
        success(`Subject '${name}' created.`);
      }
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save subject.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!subjectToDelete) return;
    setIsDeleting(true);
    try {
      await subjectService.delete(subjectToDelete.id);
      success(`Subject '${subjectToDelete.name}' deleted.`);
      setIsDeleteDialogOpen(false);
      setSubjectToDelete(null);
      fetchSubjects();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete subject with allocated faculty/exams.';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const getTypeBadge = (subType) => {
    switch (subType) {
      case 'THEORY':
        return <Badge variant="primary" size="sm">THEORY</Badge>;
      case 'PRACTICAL':
        return <Badge variant="success" size="sm">PRACTICAL</Badge>;
      default:
        return <Badge variant="purple" size="sm">ELECTIVE</Badge>;
    }
  };

  const columns = [
    {
      header: 'Code',
      key: 'code',
      render: (row) => (
        <Badge variant="primary" size="sm" className="font-mono font-bold">
          {row.code}
        </Badge>
      ),
    },
    {
      header: 'Subject Name',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-sm">{row.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            Semester {row.semester_number} • {row.course?.name}
          </div>
        </div>
      ),
    },
    {
      header: 'Type & Credits',
      key: 'type',
      render: (row) => (
        <div className="flex items-center space-x-2">
          {getTypeBadge(row.type)}
          <span className="text-xs font-bold text-slate-300">{row.credits} Cr</span>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (row) => (
        <span className="text-slate-300 text-xs font-semibold">{row.department?.code}</span>
      ),
    },
    {
      header: 'Marks Scale',
      key: 'max_marks',
      render: (row) => (
        <span className="text-xs text-slate-400">
          Pass: <strong className="text-slate-200">{row.passing_marks}</strong> / {row.max_marks}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(row)} className="p-1.5">
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSubjectToDelete(row);
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
            <BookOpen className="w-6 h-6 text-brand-400" />
            <span>Subject Catalog & Curriculum</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure theory, practical, and elective curriculum courses and credit weightages.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Add Subject
        </Button>
      </div>

      {/* Control Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-60">
              <Input
                placeholder="Search code or title..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <Select
                options={[
                  { value: '', label: 'All Courses' },
                  ...courses.map((c) => ({ value: c.id.toString(), label: c.name })),
                ]}
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-40">
              <Select
                options={[
                  { value: '', label: 'All Semesters' },
                  { value: '1', label: 'Semester 1' },
                  { value: '2', label: 'Semester 2' },
                  { value: '3', label: 'Semester 3' },
                  { value: '4', label: 'Semester 4' },
                  { value: '5', label: 'Semester 5' },
                  { value: '6', label: 'Semester 6' },
                  { value: '7', label: 'Semester 7' },
                  { value: '8', label: 'Semester 8' },
                ]}
                value={selectedSemFilter}
                onChange={(e) => setSelectedSemFilter(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchSubjects}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={subjects}
          isLoading={isLoading}
          emptyMessage="No subjects found in catalog."
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Subject' : 'Create New Subject'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Course Program"
              options={courses.map((c) => ({ value: c.id.toString(), label: c.name }))}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            />
            <Select
              label="Department"
              options={departments.map((d) => ({ value: d.id.toString(), label: d.name }))}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Subject Code"
              placeholder="e.g. CS501"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              autoFocus
            />
            <Select
              label="Semester Level"
              options={[
                { value: '1', label: 'Semester 1' },
                { value: '2', label: 'Semester 2' },
                { value: '3', label: 'Semester 3' },
                { value: '4', label: 'Semester 4' },
                { value: '5', label: 'Semester 5' },
                { value: '6', label: 'Semester 6' },
                { value: '7', label: 'Semester 7' },
                { value: '8', label: 'Semester 8' },
              ]}
              value={semesterNumber}
              onChange={(e) => setSemesterNumber(e.target.value)}
              required
            />
          </div>

          <Input
            label="Subject Title"
            placeholder="e.g. Database Management Systems"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Subject Type"
              options={[
                { value: 'THEORY', label: 'Theory' },
                { value: 'PRACTICAL', label: 'Practical / Lab' },
                { value: 'ELECTIVE', label: 'Elective' },
              ]}
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
            />
            <Input
              label="Credits"
              type="number"
              step="0.5"
              min="0"
              max="10"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              required
            />
            <Input
              label="Max Marks"
              type="number"
              min="10"
              max="200"
              value={maxMarks}
              onChange={(e) => setMaxMarks(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Subject' : 'Create Subject'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Subject"
        message={`Are you sure you want to delete subject '${subjectToDelete?.name}' (${subjectToDelete?.code})?`}
        confirmText="Delete Subject"
        isLoading={isDeleting}
      />
    </div>
  );
};
