import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: false,
});

// Attach Authorization header if a token exists in localStorage.
client.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('token') || localStorage.getItem('asgardeo_access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (e) {
    // ignore
  }
  return config;
});

export default client;
