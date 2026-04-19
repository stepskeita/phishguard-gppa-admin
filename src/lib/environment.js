/**
 * Environment Configuration
 * Centralized configuration for API endpoints.
 */

const isDev = true;

export const BACKEND_BASE_URL = isDev
  ? "http://localhost:5000"
  : "https://phishguard-backend-i2w6.onrender.com";

export const BACKEND_API_URL = `${BACKEND_BASE_URL}/api`;

export const API_CONFIG = {
  baseURL: BACKEND_API_URL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
};

export default {
  BACKEND_BASE_URL,
  BACKEND_API_URL,
  API_CONFIG,
};
