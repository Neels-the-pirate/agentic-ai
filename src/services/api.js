import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercept requests to attach JWT authorization header from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('agentflow_auth');
        if (authData) {
          const { state } = JSON.parse(authData);
          if (state && state.token) {
            config.headers.Authorization = `Bearer ${state.token}`;
          }
        }
      } catch (err) {
        console.error('Error reading auth token from storage:', err);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401 && typeof window !== 'undefined') {
      // Token expired or invalid
      if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
        localStorage.removeItem('agentflow_auth');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
