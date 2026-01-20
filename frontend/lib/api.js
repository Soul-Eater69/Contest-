import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
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

export default api;

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// Contest API
export const contestAPI = {
  createContest: (data) => api.post('/contests', data),
  getAllContests: (status) => api.get('/contests', { params: { status } }),
  getMyContests: () => api.get('/contests/my-contests'),
  getContestById: (id) => api.get(`/contests/${id}`),
  joinContest: (id) => api.post(`/contests/${id}/join`),
  startContest: (id) => api.post(`/contests/${id}/start`),
  submitContest: (id, data) => api.post(`/contests/${id}/submit`, data),
  getLeaderboard: (id) => api.get(`/contests/${id}/leaderboard`),
  getMyParticipation: (id) => api.get(`/contests/${id}/participation`),
};
