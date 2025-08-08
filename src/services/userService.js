import api from './api';

const logAxiosError = (label, error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  const url = error?.config?.url;
  console.error(`${label}: status=${status} url=${url} data=`, data || error.message);
};

const buildQuery = (obj = {}, allowedKeys = []) => {
  const params = new URLSearchParams();
  Object.keys(obj).forEach((key) => {
    if ((allowedKeys.length === 0 || allowedKeys.includes(key)) && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach((v) => params.append(key, v));
      } else {
        params.append(key, value);
      }
    }
  });
  return params.toString();
};

export const userService = {
  // Perfil do usuário
  async getProfile() {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      logAxiosError('Error getting user profile', error);
      throw error;
    }
  },

  async updateProfile(profileData) {
    try {
      const response = await api.put('/users/me', profileData);
      return response.data;
    } catch (error) {
      logAxiosError('Error updating user profile', error);
      throw error;
    }
  },

  async updatePhoto(photoUrl) {
    try {
      const response = await api.put('/users/me/photo', { photoUrl });
      return response.data;
    } catch (error) {
      logAxiosError('Error updating user photo', error);
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
      logAxiosError('Error uploading photo', error);
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
      logAxiosError('Error updating user settings', error);
      throw error;
    }
  },

  async getUserStats() {
    try {
      const response = await api.get('/users/me/stats');
      return response.data;
    } catch (error) {
      logAxiosError('Error getting user stats', error);
      throw error;
    }
  },

  async incrementViews() {
    try {
      const response = await api.post('/users/me/increment-views');
      return response.data;
    } catch (error) {
      logAxiosError('Error incrementing views', error);
      throw error;
    }
  },

  async incrementWorkouts() {
    try {
      const response = await api.post('/users/me/increment-workouts');
      return response.data;
    } catch (error) {
      logAxiosError('Error incrementing workouts', error);
      throw error;
    }
  },

  async updateLastSeen() {
    try {
      const response = await api.put('/users/me/last-seen');
      return response.data;
    } catch (error) {
      logAxiosError('Error updating last seen', error);
      throw error;
    }
  },

  // Preferências de treino
  async getWorkoutPreferences() {
    try {
      const response = await api.get('/workout-preferences');
      return response.data;
    } catch (error) {
      logAxiosError('Error getting workout preferences', error);
      throw error;
    }
  },

  async getWorkoutPreferenceCategories() {
    try {
      const response = await api.get('/workout-preferences/categories');
      return response.data;
    } catch (error) {
      logAxiosError('Error getting workout preference categories', error);
      throw error;
    }
  },

  async getPopularWorkoutPreferences(limit = 10) {
    try {
      const response = await api.get(`/workout-preferences/popular?limit=${limit}`);
      return response.data;
    } catch (error) {
      logAxiosError('Error getting popular workout preferences', error);
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
      logAxiosError('Error updating workout preferences', error);
      throw error;
    }
  },

  // Descoberta e matching
  async discoverUsers(filters = {}) {
    try {
      // Mapear workoutPreferences -> workoutTypes (back-end espera este nome)
      const mapped = { ...filters };
      if (mapped.workoutPreferences) {
        mapped.workoutTypes = mapped.workoutPreferences;
        delete mapped.workoutPreferences;
      }
      const qp = buildQuery(mapped, [
        'distance', 'minAge', 'maxAge', 'workoutTypes', 'experienceLevel', 'limit', 'offset'
      ]);
      const response = await api.get(`/matches/discover?${qp}`);
      const data = response.data;
      return data?.users ?? data; // suporta retorno como objeto ou array
    } catch (error) {
      logAxiosError('Error discovering users', error);
      throw error;
    }
  },

  async discoverUsersAdvanced(filters) {
    try {
      const body = { ...filters };
      if (body.workoutPreferences) {
        body.workoutTypes = body.workoutPreferences;
        delete body.workoutPreferences;
      }
      const response = await api.post('/matches/discover/advanced', body);
      const data = response.data;
      return data?.users ?? data;
    } catch (error) {
      logAxiosError('Error discovering users (advanced)', error);
      throw error;
    }
  },

  async getNearbyUsers(distance = 5) {
    try {
      const response = await api.get(`/matches/nearby?distance=${distance}`);
      const data = response.data;
      return data?.users ?? data;
    } catch (error) {
      logAxiosError('Error getting nearby users', error);
      throw error;
    }
  },

  async getMatches(filters = {}) {
    try {
      // Somente chaves permitidas pelo backend
      const qp = buildQuery(filters, ['unreadOnly', 'recentOnly', 'search', 'limit', 'offset']);
      const response = await api.get(`/matches?${qp}`);
      const data = response.data;
      return data?.matches ?? data; // normaliza para array
    } catch (error) {
      logAxiosError('Error getting matches', error);
      throw error;
    }
  },

  async getMatchStats() {
    try {
      const response = await api.get('/matches/stats');
      return response.data;
    } catch (error) {
      logAxiosError('Error getting match stats', error);
      throw error;
    }
  },

  async getCompatibilityScore(userId) {
    try {
      const response = await api.get(`/matches/compatibility/${userId}`);
      return response.data;
    } catch (error) {
      logAxiosError('Error getting compatibility score', error);
      throw error;
    }
  },

  async likeUser(userId, message = null) {
    try {
      const body = message ? { message } : {};
      const response = await api.post(`/matches/like/${userId}`, body);
      return response.data;
    } catch (error) {
      logAxiosError('Error liking user', error);
      throw error;
    }
  },

  async superLikeUser(userId, message = null) {
    try {
      const body = message ? { message } : {};
      const response = await api.post(`/matches/super-like/${userId}`, body);
      return response.data;
    } catch (error) {
      logAxiosError('Error super liking user', error);
      throw error;
    }
  },

  async skipUser(userId, reason = null) {
    try {
      const body = reason ? { reason } : {};
      const response = await api.post(`/matches/skip/${userId}`, body);
      return response.data;
    } catch (error) {
      logAxiosError('Error skipping user', error);
      throw error;
    }
  },

  async getSavedFilters() {
    try {
      const response = await api.get('/matches/filters/saved');
      return response.data;
    } catch (error) {
      logAxiosError('Error getting saved filters', error);
      throw error;
    }
  },

  async saveFilters(filters) {
    try {
      const response = await api.post('/matches/filters/save', filters);
      return response.data;
    } catch (error) {
      logAxiosError('Error saving filters', error);
      throw error;
    }
  },

  async getSuggestions(limit = 10) {
    try {
      const response = await api.get(`/matches/suggestions?limit=${limit}`);
      return response.data;
    } catch (error) {
      logAxiosError('Error getting suggestions', error);
      throw error;
    }
  },
};

