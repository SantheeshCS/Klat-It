import axios from 'axios';

const API_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (username, email, password) => 
    api.post('/auth/register', { username, email, password }),
  getUsers: () => api.get('/auth/users'),
};

export const messageAPI = {
  getMessages: (room) => api.get(`/messages/${room}`),
};

export default api;