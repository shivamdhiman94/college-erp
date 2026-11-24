import React, { useState, useEffect, useCallback } from 'react';
import { noticeService } from '../../services/notice.service';
import { departmentService, courseService, semesterService, sectionService } from '../../services/academic.service';
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
  Bell,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  Pin,
  Eye,
  Calendar,
  AlertTriangle,
  Users,
  Building,
  CheckCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

const NOTICE_TYPES = [
  { value: 'GENERAL', label: 'General Announcement' },
  { value: 'ACADEMIC', label: 'Academic & Curriculum' },
  { value: 'EXAMINATION', label: 'Examinations & Results' },
  { value: 'ATTENDANCE', label: 'Attendance Advisory' },
  { value: 'ASSIGNMENT', label: 'Assignments & Coursework' },
  { value: 'EVENT', label: 'Events, Seminars & Workshops' },
  { value: 'FEE', label: 'Tuition & Fee Notices' },
  { value: 'HOLIDAY', label: 'Holidays & Campus Closures' },
  { value: 'PLACEMENT', label: 'Internships & Placements' },
  { value: 'ADMINISTRATIVE', label: 'Administration Circular' },
  { value: 'EMERGENCY', label: 'Emergency Broadcast' },
  { value: 'OTHER', label: 'Other Circular' },
];

const PRIORITIES = [
  { value: 'NORMAL', label: 'Normal Priority' },
  { value: 'LOW', label: 'Low Priority' },
  { value: 'HIGH', label: 'High Priority' },
  { value: 'URGENT', label: 'Urgent Alert' },
];

const TARGET_TYPES = [
  { value: 'ALL', label: 'Entire Campus (All Users)' },
  { value: 'STUDENTS', label: 'All Students' },
  { value: 'FACULTY', label: 'All Faculty Members' },
  { value: 'DEPARTMENT', label: 'Specific Department' },
  { value: 'COURSE', label: 'Specific Degree Course' },
  { value: 'SEMESTER', label: 'Specific Semester' },
  { value: 'SECTION', label: 'Specific Section' },
];

export const AdminNoticesManagement = () => {
  const [notices, setNotices] = useState([]);
  const [stats, setStats] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('');

  // Create / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [noticeType, setNoticeType] = useState('GENERAL');
  const [priority, setPriority] = useState('NORMAL');
  const [statusVal, setStatusVal] = useState('PUBLISHED');
  const [targetType, setTargetType] = useState('ALL');
  const [departmentId, setDepartmentId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [publishAt, setPublishAt] = useState(new Date().toISOString().slice(0, 16));
  const [expiresAt, setExpiresAt] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { success, error } = useToast();

  const fetchDependencies = useCallback(async () => {
    try {
      const [deptList, crsList, semList, secList] = await Promise.all([
        departmentService.getAll(),
        courseService.getAll(),
        semesterService.getAll(),
        sectionService.getAll(),
      ]);
      setDepartments(deptList);
      setCourses(crsList);
      setSemesters(semList);
      setSections(secList);
    } catch (err) {
      console.error('Failed to load academic entities:', err);
    }
  }, []);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, statsData] = await Promise.all([
        noticeService.getNotices({
          notice_type: selectedTypeFilter || undefined,
          priority: selectedPriorityFilter || undefined,
          status_filter: selectedStatusFilter || undefined,
        }),
        noticeService.getNoticeStats(),
      ]);
      setNotices(data);
      setStats(statsData);
    } catch (err) {
      error('Failed to load notices list.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedTypeFilter, selectedPriorityFilter, selectedStatusFilter, error]);

  useEffect(() => {
    fetchDependencies();
  }, [fetchDependencies]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedNotice(null);
    setTitle('');
    setSummary('');
    setContent('');
    setNoticeType('GENERAL');
    setPriority('NORMAL');
    setStatusVal('PUBLISHED');
    setTargetType('ALL');
    setDepartmentId(departments.length > 0 ? departments[0].id.toString() : '');
    setCourseId(courses.length > 0 ? courses[0].id.toString() : '');
    setSemesterId(semesters.length > 0 ? semesters[0].id.toString() : '');
    setSectionId(sections.length > 0 ? sections[0].id.toString() : '');
    setPublishAt(new Date().toISOString().slice(0, 16));
    setExpiresAt('');
    setIsPinned(false);
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (n) => {
    setIsEditing(true);
    setSelectedNotice(n);
    setTitle(n.title);
    setSummary(n.summary || '');
    setContent(n.content);
    setNoticeType(n.notice_type);
    setPriority(n.priority);
    setStatusVal(n.status);
    setTargetType(n.target_type);
    setDepartmentId(n.department_id ? n.department_id.toString() : '');
    setCourseId(n.course_id ? n.course_id.toString() : '');
    setSemesterId(n.semester_id ? n.semester_id.toString() : '');
    setSectionId(n.section_id ? n.section_id.toString() : '');
    setPublishAt(n.publish_at ? new Date(n.publish_at).toISOString().slice(0, 16) : '');
    setExpiresAt(n.expires_at ? new Date(n.expires_at).toISOString().slice(0, 16) : '');
    setIsPinned(n.is_pinned);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveNotice = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim() || !content.trim()) {
      setFormError('Notice Title and Content are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        summary: summary.trim() || null,
        content: content.trim(),
        notice_type: noticeType,
        priority: priority,
        status: statusVal,
        target_type: targetType,
        department_id: targetType === 'DEPARTMENT' && departmentId ? parseInt(departmentId) : null,
        course_id: targetType === 'COURSE' && courseId ? parseInt(courseId) : null,
        semester_id: targetType === 'SEMESTER' && semesterId ? parseInt(semesterId) : null,
        section_id: targetType === 'SECTION' && sectionId ? parseInt(sectionId) : null,
        publish_at: publishAt ? new Date(publishAt).toISOString() : new Date().toISOString(),
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
        is_pinned: isPinned,
      };

      if (isEditing && selectedNotice) {
        await noticeService.updateNotice(selectedNotice.id, payload);
        success('Notice bulletin updated.');
      } else {
        await noticeService.createNotice(payload);
        success('Notice bulletin published.');
      }
      setIsModalOpen(false);
      fetchNotices();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to save notice.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePin = async (n) => {
    try {
      if (n.is_pinned) {
        await noticeService.unpinNotice(n.id);
        success(`Notice '${n.title}' unpinned.`);
      } else {
        await noticeService.pinNotice(n.id);
        success(`Notice '${n.title}' pinned to top.`);
      }
      fetchNotices();
    } catch (err) {
      error('Failed to toggle pin status.');
    }
  };

  const handleDelete = async () => {
    if (!noticeToDelete) return;
    setIsDeleting(true);
    try {
      await noticeService.deleteNotice(noticeToDelete.id);
      success(`Notice '${noticeToDelete.title}' removed.`);
      setIsDeleteDialogOpen(false);
      setNoticeToDelete(null);
      fetchNotices();
    } catch (err) {
      error('Failed to delete notice.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Notice Title & Summary',
      key: 'title',
      render: (row) => (
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            {row.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />}
            <span className="font-bold text-white text-sm">{row.title}</span>
          </div>
          {row.summary && <p className="text-[11px] text-slate-400 line-clamp-1">{row.summary}</p>}
        </div>
      ),
    },
    {
      header: 'Type & Priority',
      key: 'type_priority',
      render: (row) => (
        <div className="flex items-center space-x-1.5">
          <Badge variant="primary" size="sm">{row.notice_type}</Badge>
          <Badge
            variant={
              row.priority === 'URGENT'
                ? 'danger'
                : row.priority === 'HIGH'
                ? 'warning'
                : 'default'
            }
            size="sm"
          >
            {row.priority}
          </Badge>
        </div>
      ),
    },
    {
      header: 'Target Audience',
      key: 'target_type',
      render: (row) => (
        <Badge variant="cyan" size="sm" className="font-mono">
          {row.target_type}
        </Badge>
      ),
    },
    {
      header: 'Publish Window',
      key: 'published',
      render: (row) => (
        <div className="text-xs font-mono text-slate-300">
          {new Date(row.publish_at).toLocaleDateString()}
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
              : row.status === 'DRAFT'
              ? 'default'
              : 'danger'
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
            variant="ghost"
            size="sm"
            onClick={() => togglePin(row)}
            className={`p-1.5 ${row.is_pinned ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'}`}
            title={row.is_pinned ? 'Unpin Notice' : 'Pin to Top'}
          >
            <Pin className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openEditModal(row)}
            className="p-1.5"
            title="Edit Notice"
          >
            <Edit2 className="w-4 h-4 text-slate-300 hover:text-brand-400" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setNoticeToDelete(row);
              setIsDeleteDialogOpen(true);
            }}
            className="p-1.5"
            title="Delete Notice"
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
            <Bell className="w-6 h-6 text-brand-400" />
            <span>Notice & Announcement Board</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Broadcast official circulars, urgent advisories, examination notices, and departmental bulletins.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={openCreateModal}>
          Post Announcement
        </Button>
      </div>

      {/* KPI Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Total Notices</span>
            <div className="text-xl font-black text-white mt-0.5">{stats.total_notices}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Published</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5">{stats.published_count}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Drafts</span>
            <div className="text-xl font-black text-slate-300 mt-0.5">{stats.draft_count}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Pinned</span>
            <div className="text-xl font-black text-amber-400 mt-0.5">{stats.pinned_count}</div>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center">
            <span className="text-[10px] uppercase font-semibold text-slate-400">Urgent Alerts</span>
            <div className="text-xl font-black text-rose-400 mt-0.5">{stats.urgent_count}</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <Card bodyClassName="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-1">
            <div className="w-full sm:w-56">
              <Select
                options={[{ value: '', label: 'All Notice Types' }, ...NOTICE_TYPES]}
                value={selectedTypeFilter}
                onChange={(e) => setSelectedTypeFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[{ value: '', label: 'All Priorities' }, ...PRIORITIES]}
                value={selectedPriorityFilter}
                onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'PUBLISHED', label: 'Published' },
                  { value: 'DRAFT', label: 'Draft' },
                  { value: 'SCHEDULED', label: 'Scheduled' },
                ]}
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
              />
            </div>
          </div>
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={fetchNotices}>
            Refresh
          </Button>
        </div>
      </Card>

      {/* Notices Table */}
      <Card bodyClassName="p-0">
        <Table
          columns={columns}
          data={notices}
          isLoading={isLoading}
          emptyMessage="No notices published yet."
        />
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditing ? 'Edit Notice' : 'Post Official Announcement'}
        subtitle="Broadcast to campus or specific academic branches"
      >
        <form onSubmit={handleSaveNotice} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Notice Title"
            placeholder="e.g. Schedule for End Semester Examinations Spring 2025"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Brief Summary"
            placeholder="One-line overview..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />

          <div className="space-y-1 text-xs">
            <label className="font-semibold text-slate-300">Detailed Announcement Content</label>
            <textarea
              rows={4}
              placeholder="Write the full announcement bulletin..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:outline-none focus:border-brand-500 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Notice Type"
              options={NOTICE_TYPES}
              value={noticeType}
              onChange={(e) => setNoticeType(e.target.value)}
              required
            />
            <Select
              label="Priority"
              options={PRIORITIES}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
            />
            <Select
              label="Status"
              options={[
                { value: 'PUBLISHED', label: 'Publish Now' },
                { value: 'DRAFT', label: 'Save Draft' },
                { value: 'SCHEDULED', label: 'Schedule' },
              ]}
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              required
            />
          </div>

          <Select
            label="Target Audience Scope"
            options={TARGET_TYPES}
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            required
          />

          {targetType === 'DEPARTMENT' && (
            <Select
              label="Select Department"
              options={departments.map((d) => ({ value: d.id.toString(), label: `${d.code} - ${d.name}` }))}
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              required
            />
          )}

          {targetType === 'COURSE' && (
            <Select
              label="Select Course"
              options={courses.map((c) => ({ value: c.id.toString(), label: `${c.code} - ${c.name}` }))}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            />
          )}

          {targetType === 'SEMESTER' && (
            <Select
              label="Select Semester"
              options={semesters.map((s) => ({ value: s.id.toString(), label: `${s.course?.code || ''} - ${s.name}` }))}
              value={semesterId}
              onChange={(e) => setSemesterId(e.target.value)}
              required
            />
          )}

          {targetType === 'SECTION' && (
            <Select
              label="Select Section"
              options={sections.map((sec) => ({ value: sec.id.toString(), label: `Section ${sec.name} (${sec.semester?.name || ''})` }))}
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              required
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Publish Date & Time"
              type="datetime-local"
              value={publishAt}
              onChange={(e) => setPublishAt(e.target.value)}
            />
            <Input
              label="Expiration Date & Time (Optional)"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <input
              type="checkbox"
              id="isPinned"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="rounded border-slate-800 bg-slate-950 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="isPinned" className="text-xs font-medium text-slate-300">
              Pin to top of notice boards
            </label>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              {isEditing ? 'Update Notice' : 'Publish Notice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Announcement"
        message={`Are you sure you want to remove '${noticeToDelete?.title}'?`}
        confirmText="Confirm Delete"
        isLoading={isDeleting}
      />
    </div>
  );
};
