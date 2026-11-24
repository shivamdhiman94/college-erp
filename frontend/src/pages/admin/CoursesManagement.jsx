import React, { useState, useEffect, useCallback } from 'react';
import { courseService, departmentService } from '../../services/academic.service';
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
  GraduationCap,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Filter,
} from 'lucide-react';

export const CoursesManagement = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

  // Form State
  const [departmentId, setDepartmentId] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [durationYears, setDurationYears] = useState('4');
  const [totalSemesters, setTotalSemesters] = useState('8');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const depts = await departmentService.getAll();
      setDepartments(depts);
    } catch (err) {
      console.error('Error fetching departments:', err);
    }
  }, []);

  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await courseService.getAll({
        department_id: selectedDeptFilter ? parseInt(selectedDeptFilter) : undefined,
        search: searchTerm || undefined,
      });
      setCourses(data);
    } catch (err) {
      error('Failed to load courses.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedDeptFilter, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedCourse(null);
    setDepartmentId(departments.length > 0 ? departments[0].id.toString() : '');
    setCode('');
    setName('');
    setDurationYears('4');
    setTotalSemesters('8');
    setIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (crs) => {
    setIsEditing(true);
    setSelectedCourse(crs);
    setDepartmentId(crs.department_id.toString());
    setCode(crs.code);
    setName(crs.name);
    setDurationYears(crs.duration_years.toString());
    setTotalSemesters(crs.total_semesters.toString());
    setIsActive(crs.is_active);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!departmentId || !code.trim() || !name.trim()) {
      setFormError('Department, Course Code, and Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        department_id: parseInt(departmentId),
        code: code.trim().toUpperCase(),
        name: name.trim(),
        duration_years: parseInt(durationYears) || 4,
        total_semesters: parseInt(totalSemesters) || 8,
        is_active: isActive,
      };

      if (isEditing && selectedCourse) {
        await courseService.update(selectedCourse.id, payload);
        success(`Course '${name}' updated successfully.`);
      } else {
        await courseService.create(payload);
        success(`Course '${name}' created successfully.`);
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save course.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      await courseService.delete(courseToDelete.id);
      success(`Course '${courseToDelete.name}' deleted.`);
      setIsDeleteDialogOpen(false);
      setCourseToDelete(null);
      fetchCourses();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete course with active enrollments.';
      error(msg);
    } finally {
      setIsDeleting(false);
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
      header: 'Course Name',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-sm">{row.name}</div>
          <div className="text-xs text-slate-400 mt-0.5">
            {row.duration_years} Years • {row.total_semesters} Semesters
          </div>
        </div>
      ),
    },
    {
      header: 'Department',
      key: 'department',
      render: (row) => (
        <span className="text-slate-300 text-xs font-semibold">
          {row.department?.name || 'Department Ref'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'is_active',
      render: (row) => (
        <Badge variant={row.is_active ? 'success' : 'default'} size="sm" dot>
          {row.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit Course"
            className="p-1.5"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCourseToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            title="Delete Course"
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
            <GraduationCap className="w-6 h-6 text-brand-400" />
            <span>Course & Program Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Manage academic degree programs, undergraduate/postgraduate degrees, and curriculum tracks.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Add Course
        </Button>
      </div>

      {/* Control Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="relative w-full sm:w-72">
              <Input
                placeholder="Search course or code..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-60">
              <Select
                options={[
                  { value: '', label: 'All Departments' },
                  ...departments.map((d) => ({ value: d.id.toString(), label: d.name })),
                ]}
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchCourses}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={courses}
          isLoading={isLoading}
          emptyMessage="No courses found for the selected criteria."
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Course' : 'Create New Course'}
        subtitle={isEditing ? `Modifying ${selectedCourse?.name}` : 'Add a degree program to curriculum'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Select
            label="Offering Department"
            options={departments.map((d) => ({ value: d.id.toString(), label: `${d.code} - ${d.name}` }))}
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          />

          <Input
            label="Course Code"
            placeholder="e.g. BTECH_CSE, MCA, MBA"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Course / Program Name"
            placeholder="e.g. Bachelor of Technology in Computer Science"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (Years)"
              type="number"
              min="1"
              max="6"
              value={durationYears}
              onChange={(e) => setDurationYears(e.target.value)}
              required
            />
            <Input
              label="Total Semesters"
              type="number"
              min="1"
              max="12"
              value={totalSemesters}
              onChange={(e) => setTotalSemesters(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="courseIsActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <label htmlFor="courseIsActive" className="text-xs text-slate-300 font-medium">
              Course is active and open for enrollments
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Course' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Course"
        message={`Are you sure you want to delete course '${courseToDelete?.name}' (${courseToDelete?.code})?`}
        confirmText="Delete Course"
        isLoading={isDeleting}
      />
    </div>
  );
};
