import React, { useState, useEffect, useCallback } from 'react';
import { sessionService } from '../../services/academic.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Table } from '../../components/common/Table';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import {
  Calendar,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const SessionsManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sessionService.getAll();
      setSessions(data);
    } catch (err) {
      error('Failed to load academic sessions.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedSession(null);
    setName('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
    setIsCurrent(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (sess) => {
    setIsEditing(true);
    setSelectedSession(sess);
    setName(sess.name);
    setStartDate(sess.start_date);
    setEndDate(sess.end_date);
    setIsCurrent(sess.is_current);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!name.trim() || !startDate || !endDate) {
      setFormError('Session Name, Start Date, and End Date are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        start_date: startDate,
        end_date: endDate,
        is_current: isCurrent,
      };

      if (isEditing && selectedSession) {
        await sessionService.update(selectedSession.id, payload);
        success(`Academic session '${name}' updated successfully.`);
      } else {
        await sessionService.create(payload);
        success(`Academic session '${name}' created successfully.`);
      }
      setIsModalOpen(false);
      fetchSessions();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save session.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetCurrent = async (sess) => {
    try {
      await sessionService.setCurrent(sess.id);
      success(`'${sess.name}' is now the active academic session.`);
      fetchSessions();
    } catch (err) {
      error('Failed to update active session.');
    }
  };

  const handleDelete = async () => {
    if (!sessionToDelete) return;
    setIsDeleting(true);
    try {
      await sessionService.delete(sessionToDelete.id);
      success(`Session '${sessionToDelete.name}' deleted.`);
      setIsDeleteDialogOpen(false);
      setSessionToDelete(null);
      fetchSessions();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Cannot delete academic session with active dependencies.';
      error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Academic Session',
      key: 'name',
      render: (row) => (
        <div className="flex items-center space-x-2.5">
          <span className="font-bold text-white text-sm">{row.name}</span>
          {row.is_current && (
            <Badge variant="success" size="sm" dot>
              CURRENT ACTIVE
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: 'Start Date',
      key: 'start_date',
      render: (row) => <span className="text-slate-300 text-xs">{row.start_date}</span>,
    },
    {
      header: 'End Date',
      key: 'end_date',
      render: (row) => <span className="text-slate-300 text-xs">{row.end_date}</span>,
    },
    {
      header: 'Status & Action',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end space-x-2">
          {!row.is_current && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSetCurrent(row)}
              icon={CheckCircle2}
              className="text-xs py-1"
            >
              Set Active
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            title="Edit Session"
            className="p-1.5"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSessionToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            title="Delete Session"
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
            <Calendar className="w-6 h-6 text-brand-400" />
            <span>Academic Sessions & Terms</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Define institutional academic years and select the operational current term.
          </p>
        </div>
        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Add Session
        </Button>
      </div>

      {/* Data Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={sessions}
          isLoading={isLoading}
          emptyMessage="No academic sessions configured. Click 'Add Session' to begin."
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Academic Session' : 'Create Academic Session'}
        subtitle={isEditing ? `Modifying session ${selectedSession?.name}` : 'Add a new academic year'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Session Name"
            placeholder="e.g. 2025-2026 or 2026-2027"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="sessionIsCurrent"
              checked={isCurrent}
              onChange={(e) => setIsCurrent(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <label htmlFor="sessionIsCurrent" className="text-xs text-slate-300 font-medium">
              Mark as the current active academic session (unsets others)
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Session' : 'Create Session'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Academic Session"
        message={`Are you sure you want to delete session '${sessionToDelete?.name}'?`}
        confirmText="Delete Session"
        isLoading={isDeleting}
      />
    </div>
  );
};
