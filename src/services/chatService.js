import api from './api';

export const chatService = {
  // Mensagens
  async sendMessage(messageData) {
    try {
      const response = await api.post('/chat/messages', messageData);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  async getMatchMessages(matchId, filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await api.get(`/chat/matches/${matchId}/messages?${queryParams.toString()}`);
      // Backend retorna { messages, total, hasMore }
      const data = response.data;
      return Array.isArray(data) ? data : (data?.messages ?? []);
    } catch (error) {
      console.error('Error getting match messages:', error);
      throw error;
    }
  },

  async editMessage(messageId, content) {
    try {
      const response = await api.put(`/chat/messages/${messageId}`, { content });
      return response.data;
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  },

  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/chat/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  },

  // Status de leitura
  async markMessageAsRead(messageId) {
    try {
      const response = await api.put(`/chat/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  },

  async markAllMessagesAsRead(matchId) {
    try {
      const response = await api.put(`/chat/matches/${matchId}/read-all`);
      return response.data;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  },

  // Contadores
  async getUnreadMessagesCount() {
    try {
      const response = await api.get('/chat/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error getting unread messages count:', error);
      throw error;
    }
  },

  async getMatchUnreadCount(matchId) {
    try {
      const response = await api.get(`/chat/matches/${matchId}/unread-count`);
      // Aceita { count } ou { unreadCount }
      const data = response.data || {};
      return { unreadCount: data.unreadCount ?? data.count ?? 0 };
    } catch (error) {
      console.error('Error getting match unread count:', error);
      throw error;
    }
  },

  // Funcionalidades especiais
  async sendWorkoutInvite(inviteData) {
    try {
      const response = await api.post('/chat/workout-invite', inviteData);
      return response.data;
    } catch (error) {
      console.error('Error sending workout invite:', error);
      throw error;
    }
  },

  async acceptWorkoutInvite(inviteId) {
    try {
      const response = await api.put(`/chat/workout-invite/${inviteId}/accept`);
      return response.data;
    } catch (error) {
      console.error('Error accepting workout invite:', error);
      throw error;
    }
  },

  async rejectWorkoutInvite(inviteId) {
    try {
      const response = await api.put(`/chat/workout-invite/${inviteId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting workout invite:', error);
      throw error;
    }
  },

  async cancelWorkoutInvite(inviteId) {
    try {
      const response = await api.put(`/chat/workout-invite/${inviteId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling workout invite:', error);
      throw error;
    }
  },

  async getNearbyGyms(matchId, { radius = 5000, limit = 5 } = {}) {
    try {
      const response = await api.get(`/chat/matches/${matchId}/gyms/nearby?radius=${radius}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting nearby gyms:', error);
      return { gyms: [], total: 0 };
    }
  },

  async shareLocation(locationData) {
    try {
      const response = await api.post('/chat/share-location', locationData);
      return response.data;
    } catch (error) {
      console.error('Error sharing location:', error);
      throw error;
    }
  },

  // Busca
  async searchMessages(query, limit = 20) {
    try {
      const response = await api.get(`/chat/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  },
};

