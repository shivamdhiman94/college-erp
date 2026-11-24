import api from './api';

export const studentService = {
  async getAll(params) {
    const res = await api.get('/students', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/students/${id}`);
    return res.data;
  },
  async getMyProfile() {
    const res = await api.get('/students/me/profile');
    return res.data;
  },
  async create(data) {
    const res = await api.post('/students', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/students/${id}`, data);
    return res.data;
  },
  async enroll(id, data) {
    const res = await api.post(`/students/${id}/enroll`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/students/${id}`);
    return res.data;
  },
};
