import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request Interceptor: Attach Bearer JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('college_erp_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized / Token Expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('college_erp_refresh_token');

      if (refreshToken) {
        try {
          const res = await axios.post(
            `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/auth/refresh`,
            { refresh_token: refreshToken }
          );

          const newAccessToken = res.data.access_token;
          localStorage.setItem('college_erp_token', newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshErr) {
          // Token refresh failed - wipe session
          localStorage.removeItem('college_erp_token');
          localStorage.removeItem('college_erp_refresh_token');
          localStorage.removeItem('college_erp_user');
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
      } else {
        localStorage.removeItem('college_erp_token');
        localStorage.removeItem('college_erp_refresh_token');
        localStorage.removeItem('college_erp_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }

    return Promise.reject(error);
  }
);

export default api;
