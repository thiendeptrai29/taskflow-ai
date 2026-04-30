import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email: string; password: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: FormData) => api.put('/auth/profile', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.put('/auth/change-password', data),
};

// Tasks
export const taskAPI = {
  getAll: (params?: Record<string, string>) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: FormData | Record<string, unknown>) => {
    const isFormData = data instanceof FormData;
    return api.post('/tasks', data, isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : {});
  },
  update: (id: string, data: Partial<Record<string, unknown>>) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  toggle: (id: string) => api.patch(`/tasks/${id}/toggle`),
  getCalendar: (params: { year: number; month: number }) => api.get('/tasks/calendar', { params }),
  updateSubtask: (taskId: string, subtaskId: string, data: Record<string, unknown>) =>
    api.patch(`/tasks/${taskId}/subtasks/${subtaskId}`, data),
};

// AI
export const aiAPI = {
  suggestPriority: () => api.post('/ai/suggest-priority'),
  autoSchedule: (data: { date?: string; workingHours?: { start: string; end: string } }) => api.post('/ai/auto-schedule', data),
  productivityAnalysis: (days?: number) => api.get('/ai/productivity-analysis', { params: { days } }),
  chat: (data: { message: string; history?: { role: string; content: string }[] }) => api.post('/ai/chat', data),
  createTask: (text: string) => api.post('/ai/create-task', { text }),
  smartReminders: () => api.get('/ai/smart-reminders'),
};

// Notifications
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: () => api.patch('/notifications/mark-read'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

// Stats
export const statsAPI = {
  getUserStats: () => api.get('/stats'),
};

// Admin
export const adminAPI = {
  getUsers: (params?: Record<string, string>) => api.get('/admin/users', { params }),
  toggleUser: (id: string) => api.patch(`/admin/users/${id}/toggle`),
  getStats: () => api.get('/admin/stats'),
};

// Teams
export const teamAPI = {
  getTeams: () => api.get('/teams'),
  getTeam: (id: string) => api.get(`/teams/${id}`),
  createTeam: (data: any) => api.post('/teams', data),
  updateTeam: (id: string, data: any) => api.patch(`/teams/${id}`, data),
  deleteTeam: (id: string) => api.delete(`/teams/${id}`),

  getMembers: (id: string) => api.get(`/teams/${id}/members`),
  inviteMember: (id: string, data: { email: string; role: string }) =>
    api.post(`/teams/${id}/invite`, data),
  cancelInvite: (teamId: string, inviteId: string) =>
    api.delete(`/teams/${teamId}/invites/${inviteId}`),
  updateMemberRole: (teamId: string, memberId: string, data: { role: string }) =>
    api.patch(`/teams/${teamId}/members/${memberId}/role`, data),
  removeMember: (teamId: string, memberId: string) =>
    api.delete(`/teams/${teamId}/members/${memberId}`),

  getTeamTasks: (id: string, params?: any) => api.get(`/teams/${id}/tasks`, { params }),
  createTeamTask: (id: string, data: any) => api.post(`/teams/${id}/tasks`, data),
};

export default api;