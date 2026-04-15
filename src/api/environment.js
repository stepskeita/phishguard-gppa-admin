

// Single source of truth for API URLs is src/lib/environment.js
// Re-export from there so any file that imports from here still works.
export { BACKEND_BASE_URL as BACKEND_URL, BACKEND_API_URL as API_URL } from "@/lib/environment";