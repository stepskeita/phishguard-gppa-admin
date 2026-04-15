import axios from "axios";
import { API_CONFIG } from "@/lib/environment";

const TOKEN_KEY = "phish-guard-token";

const api = axios.create(API_CONFIG);

// ── Request: attach JWT ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  try {
    const token = JSON.parse(localStorage.getItem(TOKEN_KEY));

    console.log("Token:", token);
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.log(error);
    // Corrupt localStorage — proceed unauthenticated.
  }
  return config;
});

// ── Response: handle 401 ─────────────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
