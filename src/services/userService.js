import api from './api';

export const userService = {
  // Obter perfil do usuário
  getProfile: async () => {
    try {
      const response = await api.get('/users/profile');
      return response.data;
    } catch (error) {
      console.error('Failed to get user profile', error.response?.data || error.message);
      throw error;
    }
  },

  // Atualizar perfil do usuário
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile', error.response?.data || error.message);
      throw error;
    }
  },

  // Obter preferências de treino
  getWorkoutPreferences: async () => {
    try {
      const response = await api.get('/workout-preferences');
      return response.data;
    } catch (error) {
      console.error('Failed to get workout preferences', error.response?.data || error.message);
      throw error;
    }
  },

  // Atualizar preferências de treino
  updateWorkoutPreferences: async (preferences) => {
    try {
      const response = await api.put('/workout-preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Failed to update workout preferences', error.response?.data || error.message);
      throw error;
    }
  },

  // Obter usuários para descoberta
  getDiscoverUsers: async (filters = {}) => {
    try {
      const response = await api.get('/matches/discover', { params: filters });
      return response.data;
    } catch (error) {
      console.error('Failed to get discover users', error.response?.data || error.message);
      throw error;
    }
  },

  // Dar like em um usuário
  likeUser: async (userId) => {
    try {
      const response = await api.post('/matches/like', { targetUserId: userId });
      return response.data;
    } catch (error) {
      console.error('Failed to like user', error.response?.data || error.message);
      throw error;
    }
  },

  // Dar skip em um usuário
  skipUser: async (userId) => {
    try {
      const response = await api.post('/matches/skip', { targetUserId: userId });
      return response.data;
    } catch (error) {
      console.error('Failed to skip user', error.response?.data || error.message);
      throw error;
    }
  },

  // Obter matches do usuário
  getMatches: async () => {
    try {
      const response = await api.get('/matches');
      return response.data;
    } catch (error) {
      console.error('Failed to get matches', error.response?.data || error.message);
      throw error;
    }
  },
};

