import React, { useState, useEffect, useCallback } from 'react';
import { departmentService } from '../../services/academic.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  Building2,
  Plus,
  Search,
  Edit2,
  Trash2,
  RefreshCw,
  Layers,
} from 'lucide-react';

export const DepartmentsManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  
  // Form state
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await departmentService.getAll({ search: searchTerm || undefined });
      setDepartments(data);
    } catch (err) {
      error('Failed to load departments.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, error]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedDept(null);
    setCode('');
    setName('');
    setDescription('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (dept) => {
    setIsEditing(true);
    setSelectedDept(dept);
    setCode(dept.code);
    setName(dept.name);
    setDescription(dept.description || '');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!code.trim() || !name.trim()) {
      setFormError('Department Code and Name are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && selectedDept) {
        await departmentService.update(selectedDept.id, {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || null,
        });
        success(`Department '${name}' updated successfully.`);
      } else {
        await departmentService.create({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || null,
        });
        success(`Department '${name}' created successfully.`);
      }
      setIsModalOpen(false);
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save department.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deptToDelete) return;
    setIsDeleting(true);
    try {
      await departmentService.delete(deptToDelete.id);
      success(`Department '${deptToDelete.name}' deleted successfully.`);
      setIsDeleteDialogOpen(false);
      setDeptToDelete(null);
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete department with associated records.';
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
      header: 'Department Name',
      key: 'name',
      render: (row) => (
        <div>
          <div className="font-bold text-white text-sm">{row.name}</div>
          {row.description && (
            <div className="text-xs text-slate-400 mt-0.5 max-w-md truncate">
              {row.description}
            </div>
          )}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit Department"
            className="p-1.5"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDeptToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            title="Delete Department"
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
            <Building2 className="w-6 h-6 text-brand-400" />
            <span>Department Management</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure institutional departments, faculty branches, and curriculum domains.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Add Department
        </Button>
      </div>

      {/* Control Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Input
              placeholder="Search by name or code..."
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchDepartments}>
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={departments}
          isLoading={isLoading}
          emptyMessage="No departments found. Click 'Add Department' to create one."
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Department' : 'Create New Department'}
        subtitle={isEditing ? `Modifying ${selectedDept?.name}` : 'Add a new academic department'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Department Code"
            placeholder="e.g. CSE, ECE, MECH"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Department Name"
            placeholder="e.g. Computer Science & Engineering"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              className="block w-full rounded-xl border border-slate-700/80 bg-slate-900/80 text-white placeholder-slate-500 focus:border-brand-500 focus:ring-brand-500/20 text-sm p-3 focus:outline-none"
              placeholder="Brief description of the department..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Department' : 'Create Department'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete department '${deptToDelete?.name}' (${deptToDelete?.code})? This action cannot be undone.`}
        confirmText="Delete Department"
        isLoading={isDeleting}
      />
    </div>
  );
};
