import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

// Attach JWT to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('ipl_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;