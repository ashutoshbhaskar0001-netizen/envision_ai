import axios from 'axios';

let backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Remove trailing slash if present
if (backendUrl.endsWith('/')) {
  backendUrl = backendUrl.slice(0, -1);
}

// Ensure the URL ends with /api (only append if it doesn't already have it)
const baseURL = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;