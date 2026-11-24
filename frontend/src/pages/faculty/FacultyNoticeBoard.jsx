import React, { useState, useEffect, useCallback } from 'react';
import { noticeService } from '../../services/notice.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import {
  Bell,
  Plus,
  Pin,
  Calendar,
  Eye,
  Building,
  Sparkles,
} from 'lucide-react';

const NOTICE_TYPES = [
  { value: 'GENERAL', label: 'General Announcement' },
  { value: 'ACADEMIC', label: 'Academic & Curriculum' },
  { value: 'EXAMINATION', label: 'Examinations' },
  { value: 'ATTENDANCE', label: 'Attendance Advisory' },
  { value: 'ASSIGNMENT', label: 'Assignments' },
  { value: 'EVENT', label: 'Events & Seminars' },
  { value: 'OTHER', label: 'Other' },
];

export const FacultyNoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Create Notice Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [noticeType, setNoticeType] = useState('ACADEMIC');
  const [priority, setPriority] = useState('NORMAL');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail Modal
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { success, error } = useToast();

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await noticeService.getNotices();
      setNotices(data);
    } catch (err) {
      error('Failed to load notices.');
    } finally {
      setIsLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleCreateNotice = async (e) => {
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
        status: 'PUBLISHED',
        target_type: 'FACULTY',
        publish_at: new Date().toISOString(),
      };

      await noticeService.createNotice(payload);
      success('Faculty notice posted successfully.');
      setIsModalOpen(false);
      fetchNotices();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to post notice.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading faculty notices..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center space-x-2.5">
            <Bell className="w-6 h-6 text-brand-400" />
            <span>Faculty Notice & Circular Board</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Departmental communications, faculty meeting circulars, and institutional announcements.
          </p>
        </div>

        <Button variant="primary" icon={Plus} onClick={() => setIsModalOpen(true)}>
          Post Notice
        </Button>
      </div>

      {/* Notices Grid */}
      {notices.length === 0 ? (
        <Card bodyClassName="p-12 text-center text-xs text-slate-400">
          No notices available for your department.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                setSelectedNotice(n);
                setIsDetailOpen(true);
              }}
              className="cursor-pointer p-5 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-brand-500/40 transition-all shadow-xl backdrop-blur-md flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    {n.is_pinned && <Pin className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    <Badge variant="primary" size="sm">{n.notice_type}</Badge>
                    <Badge
                      variant={
                        n.priority === 'URGENT'
                          ? 'danger'
                          : n.priority === 'HIGH'
                          ? 'warning'
                          : 'default'
                      }
                      size="sm"
                    >
                      {n.priority}
                    </Badge>
                  </div>
                  <Badge variant="cyan" size="sm" className="font-mono">{n.target_type}</Badge>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{n.title}</h3>
                  {n.summary && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {n.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(n.publish_at).toLocaleDateString()}</span>
                </div>
                <span className="text-brand-400 font-semibold hover:underline">View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Post Notice for Faculty"
        subtitle="Departmental or staff announcement"
      >
        <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              {formError}
            </div>
          )}

          <Input
            label="Notice Title"
            placeholder="e.g. Department Faculty Meeting on Curriculum Revision"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <Input
            label="Brief Summary"
            placeholder="One-line summary..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
          />

          <div className="space-y-1">
            <label className="font-semibold text-slate-300">Announcement Content</label>
            <textarea
              rows={4}
              placeholder="Full announcement content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3 text-white focus:outline-none focus:border-brand-500 text-xs"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Notice Type"
              options={NOTICE_TYPES}
              value={noticeType}
              onChange={(e) => setNoticeType(e.target.value)}
              required
            />
            <Select
              label="Priority"
              options={[
                { value: 'NORMAL', label: 'Normal' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Post Notice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Notice Details Modal */}
      <Modal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={selectedNotice?.title || 'Notice Circular'}
        subtitle={`Published: ${selectedNotice ? new Date(selectedNotice.publish_at).toLocaleString() : ''}`}
      >
        <div className="space-y-4 text-xs">
          <div className="flex items-center space-x-2">
            <Badge variant="primary" size="sm">{selectedNotice?.notice_type}</Badge>
            <Badge variant="warning" size="sm">{selectedNotice?.priority} Priority</Badge>
          </div>

          {selectedNotice?.summary && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-brand-300 font-medium">
              "{selectedNotice.summary}"
            </div>
          )}

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-slate-200 leading-relaxed whitespace-pre-wrap">
            {selectedNotice?.content}
          </div>

          <div className="flex justify-end pt-2 border-t border-slate-800">
            <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
