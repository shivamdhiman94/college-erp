import api from './api';

export const examService = {
  // Exams CRUD
  async getExams(params) {
    const res = await api.get('/exams', { params });
    return res.data;
  },

  async getExamById(id) {
    const res = await api.get(`/exams/${id}`);
    return res.data;
  },

  async createExam(data) {
    const res = await api.post('/exams', data);
    return res.data;
  },

  async updateExam(id, data) {
    const res = await api.put(`/exams/${id}`, data);
    return res.data;
  },

  async deleteExam(id) {
    const res = await api.delete(`/exams/${id}`);
    return res.data;
  },

  async publishExam(id) {
    const res = await api.post(`/exams/${id}/publish`);
    return res.data;
  },

  async unpublishExam(id) {
    const res = await api.post(`/exams/${id}/unpublish`);
    return res.data;
  },

  // Schedules
  async addSchedule(examId, data) {
    const res = await api.post(`/exams/${examId}/schedules`, data);
    return res.data;
  },

  async deleteSchedule(scheduleId) {
    const res = await api.delete(`/exams/schedules/${scheduleId}`);
    return res.data;
  },

  // Marks Entry & Reports
  async getStudentsForSchedule(scheduleId, sectionId) {
    const res = await api.get(`/marks/students-for-schedule/${scheduleId}`, {
      params: { section_id: sectionId },
    });
    return res.data;
  },

  async bulkSaveMarks(payload) {
    const res = await api.post('/marks/bulk-save', payload);
    return res.data;
  },

  async getMyResults() {
    const res = await api.get('/marks/my-results');
    return res.data;
  },

  async getStudentExamCard(studentId, examId) {
    const res = await api.get(`/marks/student/${studentId}/exam/${examId}`);
    return res.data;
  },

  async getGradesScale() {
    const res = await api.get('/marks/grades-scale');
    return res.data;
  },
};
