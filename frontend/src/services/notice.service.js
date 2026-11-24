import api from './api';

export const noticeService = {
  async getNotices(params) {
    const res = await api.get('/notices', { params });
    return res.data;
  },

  async getNoticeById(id) {
    const res = await api.get(`/notices/${id}`);
    return res.data;
  },

  async createNotice(data) {
    const res = await api.post('/notices', data);
    return res.data;
  },

  async updateNotice(id, data) {
    const res = await api.put(`/notices/${id}`, data);
    return res.data;
  },

  async deleteNotice(id) {
    const res = await api.delete(`/notices/${id}`);
    return res.data;
  },

  async pinNotice(id) {
    const res = await api.post(`/notices/${id}/pin`);
    return res.data;
  },

  async unpinNotice(id) {
    const res = await api.post(`/notices/${id}/unpin`);
    return res.data;
  },

  async markAsRead(id) {
    const res = await api.post(`/notices/${id}/read`);
    return res.data;
  },

  async markAllAsRead() {
    const res = await api.post('/notices/mark-all-read');
    return res.data;
  },

  async getUnreadCount() {
    const res = await api.get('/notices/unread-count');
    return res.data;
  },

  async getNoticeStats() {
    const res = await api.get('/notices/statistics');
    return res.data;
  },
};
