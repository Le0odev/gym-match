import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Control concurrent refresh requests
let refreshPromise = null;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If there's already a refresh in progress, wait for it
        if (refreshPromise) {
          await refreshPromise;
          const newToken = localStorage.getItem('accessToken');
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }
        }

        // Start a new refresh process
        refreshPromise = (async () => {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
              refreshToken,
            });

            const { accessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
          }
        })();

        await refreshPromise;
        refreshPromise = null;

        const newToken = localStorage.getItem('accessToken');
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        refreshPromise = null;
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (userData) => api.post('/auth/register', userData),
  login: (credentials) => api.post('/auth/login', credentials),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/auth/logout', refreshToken),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  updateLocation: (locationData) => api.put('/users/me/location', locationData),
  addWorkoutPreferences: (preferences) => api.post('/users/me/workout-preferences', preferences),
  getWorkoutPreferences: () => api.get('/users/me/workout-preferences'),
};

// Workout Preferences API
export const workoutPreferencesAPI = {
  getAll: () => api.get('/workout-preferences'),
};

// Matches API
export const matchesAPI = {
  discover: (filters) => api.get('/matches/discover', { params: filters }),
  like: (userId) => api.post(`/matches/like/${userId}`),
  skip: (userId) => api.post(`/matches/skip/${userId}`),
  getMatches: () => api.get('/matches'),
};

export default api;

