import api from './api';

export const authService = {
  /**
   * Authenticate user with username or email and password
   */
  async login(username_or_email, password) {
    const response = await api.post('/auth/login', {
      username_or_email,
      password,
    });
    return response.data;
  },

  /**
   * Fetch current user profile details
   */
  async getMe() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Refresh JWT token
   */
  async refreshToken(refresh_token) {
    const response = await api.post('/auth/refresh', {
      refresh_token,
    });
    return response.data;
  },

  /**
   * Change user password
   */
  async changePassword(old_password, new_password) {
    const response = await api.post('/auth/change-password', {
      old_password,
      new_password,
    });
    return response.data;
  },
};
