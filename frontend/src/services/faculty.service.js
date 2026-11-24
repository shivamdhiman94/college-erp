import api from './api';

export const facultyService = {
  async getAll(params) {
    const res = await api.get('/faculty', { params });
    return res.data;
  },
  async getById(id) {
    const res = await api.get(`/faculty/${id}`);
    return res.data;
  },
  async getMyProfile() {
    const res = await api.get('/faculty/me/profile');
    return res.data;
  },
  async create(data) {
    const res = await api.post('/faculty', data);
    return res.data;
  },
  async update(id, data) {
    const res = await api.put(`/faculty/${id}`, data);
    return res.data;
  },
  async delete(id) {
    const res = await api.delete(`/faculty/${id}`);
    return res.data;
  },
  async getAllAllocations(params) {
    const res = await api.get('/allocations', { params });
    return res.data;
  },
  async getMyAllocations() {
    const res = await api.get('/allocations/my-allocations');
    return res.data;
  },
  async createAllocation(data) {
    const res = await api.post('/allocations', data);
    return res.data;
  },
  async deleteAllocation(id) {
    const res = await api.delete(`/allocations/${id}`);
    return res.data;
  },
};
