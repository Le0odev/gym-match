import api from './api';

export const userService = {
  // Perfil do usuário
  async getProfile() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/me', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  async updatePhoto(photoUrl) {
    try {
      const response = await api.put('/users/me/photo', { photoUrl });
      return response.data;
    } catch (error) {
      console.error('Error updating user photo:', error);
      throw error;
    }
  },

  async uploadPhoto(photoFile) {
    try {
      const formData = new FormData();
      formData.append('photo', {
        uri: photoFile.uri,
        type: photoFile.type || 'image/jpeg',
        name: photoFile.fileName || 'profile-photo.jpg',
      });

      const response = await api.post('/users/me/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000, // 30 segundos para upload
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading photo:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Erro ao fazer upload da foto. Tente novamente.');
    }
  },

  async updateSettings(settings) {
    try {
      const response = await api.put('/users/me/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  },

  async getUserStats() {
    try {
      const response = await api.get('/users/me/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  },

  async incrementViews() {
    try {
      const response = await api.post('/users/me/increment-views');
      return response.data;
    } catch (error) {
      console.error('Error incrementing views:', error);
      throw error;
    }
  },

  async incrementWorkouts() {
    try {
      const response = await api.post('/users/me/increment-workouts');
      return response.data;
    } catch (error) {
      console.error('Error incrementing workouts:', error);
      throw error;
    }
  },

  async updateLastSeen() {
    try {
      const response = await api.put('/users/me/last-seen');
      return response.data;
    } catch (error) {
      console.error('Error updating last seen:', error);
      throw error;
    }
  },

  // Preferências de treino
  async getWorkoutPreferences() {
    try {
      const response = await api.get('/workout-preferences');
      return response.data;
    } catch (error) {
      console.error('Error getting workout preferences:', error);
      throw error;
    }
  },

  async getWorkoutPreferenceCategories() {
    try {
      const response = await api.get('/workout-preferences/categories');
      return response.data;
    } catch (error) {
      console.error('Error getting workout preference categories:', error);
      throw error;
    }
  },

  async getPopularWorkoutPreferences(limit = 10) {
    try {
      const response = await api.get(`/workout-preferences/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting popular workout preferences:', error);
      throw error;
    }
  },

  async updateWorkoutPreferences(preferenceIds) {
    try {
      const response = await api.put('/users/me/workout-preferences', {
        workoutPreferenceIds: preferenceIds,
      });
      return response.data;
    } catch (error) {
      console.error('Error updating workout preferences:', error);
      throw error;
    }
  },

  // Descoberta e matching
  async discoverUsers(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          if (Array.isArray(filters[key])) {
            filters[key].forEach(value => queryParams.append(key, value));
          } else {
            queryParams.append(key, filters[key]);
          }
        }
      });

      const response = await api.get(`/matches/discover?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error discovering users:', error);
      throw error;
    }
  },

  async discoverUsersAdvanced(filters) {
    try {
      const response = await api.post('/matches/discover/advanced', filters);
      return response.data;
    } catch (error) {
      console.error('Error discovering users (advanced):', error);
      throw error;
    }
  },

  async getNearbyUsers(distance = 5) {
    try {
      const response = await api.get(`/matches/nearby?distance=${distance}`);
      return response.data;
    } catch (error) {
      console.error('Error getting nearby users:', error);
      throw error;
    }
  },

  async getSuggestions(limit = 10) {
    try {
      const response = await api.get(`/matches/suggestions?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  },

  async likeUser(userId, message = null) {
    try {
      const body = message ? { message } : {};
      const response = await api.post(`/matches/like/${userId}`, body);
      return response.data;
    } catch (error) {
      console.error('Error liking user:', error);
      throw error;
    }
  },

  async superLikeUser(userId, message = null) {
    try {
      const body = message ? { message } : {};
      const response = await api.post(`/matches/super-like/${userId}`, body);
      return response.data;
    } catch (error) {
      console.error('Error super liking user:', error);
      throw error;
    }
  },

  async skipUser(userId, reason = null) {
    try {
      const body = reason ? { reason } : {};
      const response = await api.post(`/matches/skip/${userId}`, body);
      return response.data;
    } catch (error) {
      console.error('Error skipping user:', error);
      throw error;
    }
  },

  async getMatches(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await api.get(`/matches?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting matches:', error);
      throw error;
    }
  },

  async getMatchStats() {
    try {
      const response = await api.get('/matches/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting match stats:', error);
      throw error;
    }
  },

  async getCompatibilityScore(userId) {
    try {
      const response = await api.get(`/matches/compatibility/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting compatibility score:', error);
      throw error;
    }
  },

  async unmatch(matchId) {
    try {
      const response = await api.post(`/matches/unmatch/${matchId}`);
      return response.data;
    } catch (error) {
      console.error('Error unmatching:', error);
      throw error;
    }
  },

  async getSavedFilters() {
    try {
      const response = await api.get('/matches/filters/saved');
      return response.data;
    } catch (error) {
      console.error('Error getting saved filters:', error);
      throw error;
    }
  },

  async saveFilters(filters) {
    try {
      const response = await api.post('/matches/filters/save', filters);
      return response.data;
    } catch (error) {
      console.error('Error saving filters:', error);
      throw error;
    }
  },
};

