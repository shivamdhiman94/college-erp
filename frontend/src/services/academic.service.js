import api from './api';

export const departmentService = {
  async getAll(params) {
    const res = await api.get('/departments', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/departments/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post('/departments', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/departments/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/departments/${id}`);
    return res.data;
  },
};

export const courseService = {
  async getAll(params) {
    const res = await api.get('/courses', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/courses/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post('/courses', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/courses/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/courses/${id}`);
    return res.data;
  },
};

export const sessionService = {
  async getAll(params) {
    const res = await api.get('/sessions', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/sessions/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post('/sessions', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/sessions/${id}`, data);
    return res.data;
  },
  async setCurrent(id) {
    const res = await api.post(`/sessions/${id}/set-current`);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/sessions/${id}`);
    return res.data;
  },
};

export const semesterService = {
  async getAll(params) {
    const res = await api.get('/semesters', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/semesters/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post('/semesters', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/semesters/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/semesters/${id}`);
    return res.data;
  },
};

export const sectionService = {
  async getAll(params) {
    const res = await api.get('/sections', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/sections/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post('/sections', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/sections/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/sections/${id}`);
    return res.data;
  },
};

export const subjectService = {
  async getAll(params) {
    const res = await api.get('/subjects', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/subjects/${id}`);
    return res.data;
  },
  async create(data) {
    const res = await api.post('/subjects', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/subjects/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/subjects/${id}`);
    return res.data;
  },
};

export const dashboardService = {
  async getAdminStats() {
    const res = await api.get('/dashboard/admin');
    return res.data;
  },
};
