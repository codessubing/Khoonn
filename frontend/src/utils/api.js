import axios from "axios";

// ✅ PRODUCTION FIX: Auto-switch between Render backend and localhost
const API_BASE_URL = import.meta.env.PROD 
  ? "https://khoonn-backend.onrender.com" // 👈 Your live Render backend
  : "http://localhost:5000";              // 👈 Local development

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle expired sessions globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;