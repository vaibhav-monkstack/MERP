import axios from "axios";

// Safe access to import.meta.env for testing compatibility
const baseURL = (() => {
  try {
    return import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  } catch {
    return 'http://localhost:5001/api';
  }
})();

const API = axios.create({
  baseURL: baseURL,
});

// Add a request interceptor to attach the JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;