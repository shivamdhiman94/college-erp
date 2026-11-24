import api from './api';

export const timetableService = {
  // Room Endpoints
  async getRooms(params) {
    const res = await api.get('/rooms', { params });
    return res.data;
  },

  async createRoom(data) {
    const res = await api.post('/rooms', data);
    return res.data;
  },

  async updateRoom(id, data) {
    const res = await api.put(`/rooms/${id}`, data);
    return res.data;
  },

  async deleteRoom(id) {
    const res = await api.delete(`/rooms/${id}`);
    return res.data;
  },

  // Timetable Slot Endpoints
  async getTimetables(params) {
    const res = await api.get('/timetable', { params });
    return res.data;
  },

  async createTimetable(data) {
    const res = await api.post('/timetable', data);
    return res.data;
  },

  async updateTimetable(id, data) {
    const res = await api.put(`/timetable/${id}`, data);
    return res.data;
  },

  async deleteTimetable(id) {
    const res = await api.delete(`/timetable/${id}`);
    return res.data;
  },

  // Schedule Views
  async getSectionWeekly(sectionId) {
    const res = await api.get(`/timetable/section/${sectionId}/weekly`);
    return res.data;
  },

  async getMyFacultySchedule() {
    const res = await api.get('/timetable/faculty/my-schedule');
    return res.data;
  },

  async getMyStudentSchedule() {
    const res = await api.get('/timetable/student/my-schedule');
    return res.data;
  },
};
