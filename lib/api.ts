import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (config.url?.startsWith('/api/')) {
      // Prevent the request from being sent if there's no token for protected routes
      return Promise.reject({ 
        message: 'No authentication token found',
        response: { status: 401 } 
      });
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // Skip automatic redirect to /login if the request itself was a login attempt
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login') && typeof window !== 'undefined') {
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
export const getDepartments = (params?: object) => api.get('/api/departments', { params });
export const createDepartment = (data: object) => api.post('/api/departments', data);
export const updateDepartment = (id: number, data: object) => api.put(`/api/departments/${id}`, data);
export const deleteDepartment = (id: number) => api.delete(`/api/departments/${id}`);

// ─── Sewadars ─────────────────────────────────────────────────────────────
export const getSewadars = (params?: object) => api.get('/api/sewadars', { params });
export const createSewadar = (data: object) => api.post('/api/sewadars', data);
export const updateSewadar = (id: number, data: object) => api.put(`/api/sewadars/${id}`, data);
export const deleteSewadar = (id: number) => api.delete(`/api/sewadars/${id}`);
export const transferSewadar = (sewadar_id: number, department_id: number) =>
  api.post('/api/sewadars/transfer', { sewadar_id, department_id });
export const exportSewadars = (params?: object) =>
  api.get('/api/sewadars/export', { params, responseType: 'blob' });
export const getSewadarByUUID = (uuid: string) =>
  api.get(`/api/sewadars/u/${uuid}`);
export const bulkUploadSewadars = (file: File, centerId?: number) => {
  const form = new FormData();
  form.append('file', file);
  if (centerId) {
    form.append('center_id', centerId.toString());
  }
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
export const getDashboard = (params?: object) => api.get('/api/dashboard', { params });

// ─── Centers ──────────────────────────────────────────────────────────────
export const getCenters = () => api.get('/api/centers');
export const createCenter = (data: object) => api.post('/api/centers', data);
export const updateCenter = (id: number, data: object) => api.put(`/api/centers/${id}`, data);
export const deleteCenter = (id: number) => api.delete(`/api/centers/${id}`);

// ─── Users ────────────────────────────────────────────────────────────────
export const getUsers = () => api.get('/api/users');
export const createUser = (data: object) => api.post('/api/users', data);
export const updateUser = (id: number, data: object) => api.put(`/api/users/${id}`, data);
export const deleteUser = (id: number) => api.delete(`/api/users/${id}`);

// ─── Feedback ─────────────────────────────────────────────────────────────
export const submitFeedback = (data: { subject: string; message: string }) =>
  api.post('/api/feedback', data);

export const getFeedbacks = () => api.get('/api/feedback');

export const markFeedbackAsRead = (id: number) =>
  api.put(`/api/feedback/${id}/read`);

export const deleteFeedback = (id: number) =>
  api.delete(`/api/feedback/${id}`);

// ─── Inventory ────────────────────────────────────────────────────────────
export const getInventoryItems = (params?: object) => api.get('/api/inventory', { params });
export const getInventoryItem = (id: number) => api.get(`/api/inventory/${id}`);
export const createInventoryItem = (data: object) => api.post('/api/inventory', data);
export const updateInventoryItem = (id: number, data: object) => api.put(`/api/inventory/${id}`, data);
export const deleteInventoryItem = (id: number) => api.delete(`/api/inventory/${id}`);
export const updateInventoryStock = (id: number, data: { quantity_changed: number; transaction_type: string; remarks?: string }) =>
  api.post(`/api/inventory/${id}/stock`, data);
export const getInventoryTransactions = (id: number) => api.get(`/api/inventory/${id}/transactions`);
