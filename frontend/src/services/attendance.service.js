import api from './api';

export const attendanceService = {
  async getRosterForAllocation(allocationId, sessionDate) {
    const res = await api.get(`/attendance/students-for-allocation/${allocationId}`, {
      params: { session_date: sessionDate },
    });
    return res.data;
  },

  async saveAttendanceSession(payload) {
    const res = await api.post('/attendance/sessions', payload);
    return res.data;
  },

  async listSessions(params) {
    const res = await api.get('/attendance/sessions', { params });
    return res.data;
  },

  async getMyAttendance() {
    const res = await api.get('/attendance/my-attendance');
    return res.data;
  },

  async getMyHistory(params) {
    const res = await api.get('/attendance/my-history', { params });
    return res.data;
  },

  async getStudentAttendance(studentId) {
    const res = await api.get(`/attendance/student/${studentId}`);
    return res.data;
  },

  async getSectionReport(sectionId) {
    const res = await api.get(`/attendance/reports/section/${sectionId}`);
    return res.data;
  },
};
