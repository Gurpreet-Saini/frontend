import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

// ─── Auth ─────────────────────────────────────────────────────────────────
export const login = (username: string, password: string) =>
  api.post('/auth/login', { username, password });

export const getMe = () => api.get('/api/me');

// ─── Departments ──────────────────────────────────────────────────────────
export const getDepartments = () => api.get('/api/departments');
export const createDepartment = (data: object) => api.post('/api/departments', data);
export const updateDepartment = (id: number, data: object) => api.put(`/api/departments/${id}`, data);
export const deleteDepartment = (id: number) => api.delete(`/api/departments/${id}`);

// ─── Sewadars ─────────────────────────────────────────────────────────────
export const getSewadars = (params?: object) => api.get('/api/sewadars', { params });
export const searchSewadars = (q: string, department_id?: number) =>
  api.get('/api/sewadars/search', { params: { q, department_id } });
export const createSewadar = (data: object) => api.post('/api/sewadars', data);
export const updateSewadar = (id: number, data: object) => api.put(`/api/sewadars/${id}`, data);
export const deleteSewadar = (id: number) => api.delete(`/api/sewadars/${id}`);
export const transferSewadar = (sewadar_id: number, department_id: number) =>
  api.post('/api/sewadars/transfer', { sewadar_id, department_id });
export const exportSewadars = (department_id?: number) =>
  api.get('/api/sewadars/export', { params: { department_id }, responseType: 'blob' });
export const bulkUploadSewadars = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/api/sewadars/bulk-upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

// ─── Attendance ───────────────────────────────────────────────────────────
export const getAttendance = (params?: object) => api.get('/api/attendance', { params });
export const checkIn = (sewadar_id: number, department_id: number) =>
  api.post('/api/attendance/check-in', { sewadar_id, department_id });
export const checkOut = (id: number) => api.put(`/api/attendance/${id}/check-out`);
export const updateAttendance = (id: number, data: object) => api.put(`/api/attendance/${id}`, data);
export const exportAttendance = (params?: object) =>
  api.get('/api/attendance/export', { params, responseType: 'blob' });
export const getDashboard = () => api.get('/api/dashboard');

// ─── Centers ──────────────────────────────────────────────────────────────
export const getCenters = () => api.get('/api/centers');
