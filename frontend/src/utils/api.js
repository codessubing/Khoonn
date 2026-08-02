import axios from "axios";

// ✅ Auto-switch between Render (prod) and localhost (dev)
const API_BASE_URL = import.meta.env.PROD 
  ? "https://khoonn.onrender.com" 
  : "http://localhost:5000";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`, // Appends /api automatically
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