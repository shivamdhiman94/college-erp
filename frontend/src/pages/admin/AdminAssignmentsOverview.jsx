import React, { useState, useEffect, useCallback } from 'react';
import { assignmentService } from '../../services/assignment.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import {
  FileText,
  Trash2,
  RefreshCw,
  Eye,
  Layers,
  BookOpen,
  Calendar,
} from 'lucide-react';

export const AdminAssignmentsOverview = () => {
  const [assignments, setAssignments] = useState([]);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [asgToDelete, setAsgToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await assignmentService.getAssignments({
        status_filter: selectedStatusFilter || undefined,
      });
      setAssignments(data);
    } catch (err) {
      error('Failed to load assignments.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedStatusFilter, error]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleDelete = async () => {
    if (!asgToDelete) return;
    setIsDeleting(true);
    try {
      await assignmentService.deleteAssignment(asgToDelete.id);
      success(`Assignment '${asgToDelete.title}' removed.`);
      setIsDeleteDialogOpen(false);
      setAsgToDelete(null);
      fetchAssignments();
    } catch (err) {
      error('Failed to delete assignment.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Coursework Title',
      key: 'title',
      render: (row) => (
        <div>
          <span className="font-bold text-white text-sm">{row.title}</span>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {row.allocation?.subject?.code} - {row.allocation?.subject?.name}
          </div>
        </div>
      ),
    },
    {
      header: 'Instructor & Section',
      key: 'instructor',
      render: (row) => (
        <div>
          <Badge variant="primary" size="sm">Sec {row.allocation?.section?.name}</Badge>
          <div className="text-xs text-slate-300 font-semibold mt-0.5">
            {row.allocation?.faculty ? `${row.allocation.faculty.first_name} ${row.allocation.faculty.last_name}` : 'Staff'}
          </div>
        </div>
      ),
    },
    {
      header: 'Due Date',
      key: 'due_date',
      render: (row) => (
        <span className="font-mono text-xs text-slate-300">
          {new Date(row.due_date).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Turned In',
      key: 'submissions',
      render: (row) => (
        <Badge variant="cyan" size="sm" className="font-mono font-bold">
          {row.total_submissions_count} Submissions
        </Badge>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => (
        <Badge variant={row.status === 'PUBLISHED' ? 'success' : 'default'} size="sm">
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
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setAsgToDelete(row);
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
            <span>Institution Coursework & Assignments</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Campus-wide homework assignments, submission metrics, and academic coursework compliance.
          </p>
        </div>

        <Button variant="secondary" icon={RefreshCw} onClick={fetchAssignments}>
          Refresh Overview
        </Button>
      </div>

      {/* Filter Bar */}
      <Card bodyClassName="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="w-full sm:w-64">
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
          <div className="text-xs text-slate-400 font-semibold">
            Total Tracked: <strong className="text-white">{assignments.length} Assignments</strong>
          </div>
        </div>
      </Card>

      {/* Assignments Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={assignments}
          isLoading={isLoading}
          emptyMessage="No coursework records found."
        />
      </Card>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Assignment"
        message={`Are you sure you want to remove '${asgToDelete?.title}'?`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
