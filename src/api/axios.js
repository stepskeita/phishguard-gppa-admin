import axios from "axios";
import { toast } from "sonner";
import { API_CONFIG } from "@/lib/environment";

const TOKEN_KEY = "jambarr360-token";

const api = axios.create(API_CONFIG);

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  try {
    const token = JSON.parse(localStorage.getItem(TOKEN_KEY));
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // Corrupt localStorage — proceed unauthenticated.
  }

  // Let axios set Content-Type automatically for multipart uploads
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// ── Response: handle 401 / 403 ────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.replace('/login');
    }
    // Backend-enforced (middleware/auth.js) on every route except the small
    // exempt set /change-password itself needs — this is the safety net for
    // any call that reaches the API before AuthContext's own redirect (see
    // ProtectedRoute in App.jsx) has a chance to run.
    if (error.response?.status === 403 && error.response?.data?.mustChangePassword) {
      window.location.replace('/change-password');
      return Promise.reject(error);
    }
    // Mutating requests already surface permission errors via each page's
    // own onError toast (using the same response body) — only add a global
    // toast for GETs, which otherwise fail silently with no visible error.
    if (error.response?.status === 403 && error.config?.method === 'get') {
      toast.error(error.response?.data?.error || "You don't have permission to view this.");
    }
    return Promise.reject(error);
  }
);

export default api;
