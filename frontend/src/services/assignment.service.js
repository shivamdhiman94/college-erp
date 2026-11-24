import api from './api';

export const assignmentService = {
  // Faculty & Admin APIs
  async getAssignments(params) {
    const res = await api.get('/assignments', { params });
    return res.data;
  },

  async getAssignmentById(id) {
    const res = await api.get(`/assignments/${id}`);
    return res.data;
  },

  async createAssignment(data) {
    const res = await api.post('/assignments', data);
    return res.data;
  },

  async updateAssignment(id, data) {
    const res = await api.put(`/assignments/${id}`, data);
    return res.data;
  },

  async deleteAssignment(id) {
    const res = await api.delete(`/assignments/${id}`);
    return res.data;
  },

  async publishAssignment(id) {
    const res = await api.post(`/assignments/${id}/publish`);
    return res.data;
  },

  async closeAssignment(id) {
    const res = await api.post(`/assignments/${id}/close`);
    return res.data;
  },

  async getSubmissions(assignmentId) {
    const res = await api.get(`/assignments/${assignmentId}/submissions`);
    return res.data;
  },

  async getAssignmentStats(assignmentId) {
    const res = await api.get(`/assignments/${assignmentId}/statistics`);
    return res.data;
  },

  async gradeSubmission(submissionId, data) {
    const res = await api.post(`/assignments/submissions/${submissionId}/grade`, data);
    return res.data;
  },

  async returnSubmission(submissionId, feedback) {
    const res = await api.post(`/assignments/submissions/${submissionId}/return`, null, {
      params: { feedback },
    });
    return res.data;
  },

  // Student APIs
  async getMyStudentAssignments() {
    const res = await api.get('/assignments/student/my-assignments');
    return res.data;
  },

  async submitAssignment(assignmentId, data) {
    const res = await api.post(`/assignments/${assignmentId}/submit`, data);
    return res.data;
  },
};
