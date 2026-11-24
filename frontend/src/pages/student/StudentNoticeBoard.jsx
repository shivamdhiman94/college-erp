import React, { useState, useEffect, useCallback } from 'react';
import { noticeService } from '../../services/notice.service';
import { useToast } from '../../hooks/useToast';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Card } from '../../components/common/Card';
import { Spinner } from '../../components/common/Spinner';
import {
  Bell,
  Pin,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Eye,
  Check,
  Search,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export const StudentNoticeBoard = () => {
  const [notices, setNotices] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD' | 'IMPORTANT'
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Notice Details Modal State
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { success, error } = useToast();

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, unreadData] = await Promise.all([
        noticeService.getNotices({ search: searchTerm || undefined }),
        noticeService.getUnreadCount(),
      ]);
      setNotices(data);
      setUnreadCount(unreadData.unread_count);
    } catch (err) {
      error('Failed to load notices.');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, error]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const handleOpenNotice = async (n) => {
    setSelectedNotice(n);
    setIsDetailOpen(true);
    if (!n.is_read) {
      try {
        await noticeService.markAsRead(n.id);
        setNotices((prev) => prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Failed to mark read:', err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await noticeService.markAllAsRead();
      success('All notices marked as read.');
      setNotices((prev) => prev.map((item) => ({ ...item, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      error('Failed to mark all as read.');
    }
  };

  const filteredNotices = notices.filter((n) => {
    if (filter === 'UNREAD') return !n.is_read;
    if (filter === 'IMPORTANT') return n.priority === 'URGENT' || n.priority === 'HIGH' || n.is_pinned;
    return true;
  });

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <Spinner size="lg" label="Loading notice bulletin board..." />
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
            <span>Campus Notice & Circular Board</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Official announcements, examination circulars, timetable adjustments, and institutional bulletins.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" icon={Check} onClick={handleMarkAllRead} className="text-xs">
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex space-x-2 w-full sm:w-auto">
          {[
            { id: 'ALL', label: `All Notices (${notices.length})` },
            { id: 'UNREAD', label: `Unread (${unreadCount})` },
            { id: 'IMPORTANT', label: `Important (${notices.filter((n) => n.is_pinned || n.priority === 'URGENT' || n.priority === 'HIGH').length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                filter === tab.id
                  ? 'bg-brand-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 text-white text-xs focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Notices Grid */}
      {filteredNotices.length === 0 ? (
        <Card bodyClassName="p-12 text-center text-xs text-slate-400">
          No notices found matching this filter.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenNotice(n)}
              className={`cursor-pointer p-5 rounded-3xl border transition-all shadow-xl backdrop-blur-md flex flex-col justify-between space-y-3 ${
                n.is_pinned
                  ? 'bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 border-amber-500/40 hover:border-amber-400'
                  : n.priority === 'URGENT'
                  ? 'bg-gradient-to-br from-rose-950/20 via-slate-900 to-slate-900 border-rose-500/40 hover:border-rose-400'
                  : !n.is_read
                  ? 'bg-slate-900/90 border-brand-500/40 hover:border-brand-400'
                  : 'bg-slate-900/50 border-slate-800/80 hover:border-slate-700'
              }`}
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
                  {!n.is_read ? (
                    <Badge variant="cyan" size="sm" className="font-bold">
                      NEW
                    </Badge>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-mono">Read</span>
                  )}
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
                <span className="text-brand-400 font-semibold hover:underline">Read Circular →</span>
              </div>
            </div>
          ))}
        </div>
      )}

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
            <Badge
              variant={
                selectedNotice?.priority === 'URGENT'
                  ? 'danger'
                  : selectedNotice?.priority === 'HIGH'
                  ? 'warning'
                  : 'default'
              }
              size="sm"
            >
              {selectedNotice?.priority} Priority
            </Badge>
            <Badge variant="cyan" size="sm">Audience: {selectedNotice?.target_type}</Badge>
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
