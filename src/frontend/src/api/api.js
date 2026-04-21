import axios from "axios";

// Standardize API URL collection
export const API_BASE = (() => {
  try {
    // Priority: 1. Env Var, 2. Local Fallback (Standardized to 5000)
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  } catch {
    return 'http://localhost:5000/api';
  }
})();

const API = axios.create({
  baseURL: API_BASE,
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