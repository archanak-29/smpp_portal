import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const sessionId = localStorage.getItem('SESSIONID');
    if (sessionId) {
      config.headers['SESSIONID'] = sessionId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.data?.status === 'Session expired' || error.response.data?.status === 'Invalid Session')) {
      // Handle logout if needed globally, but often better done in context/components
      // to avoid circular dependencies
      localStorage.removeItem('SESSIONID');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
