import api from './api';
import { userService } from './userService';

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
  async getMatchInvites(matchId) {
    try {
      const response = await api.get(`/chat/matches/${matchId}/invites`);
      return response.data;
    } catch (error) {
      // Fallback silencioso: backend pode não suportar esse endpoint em todas as versões
      return { invites: [], total: 0 };
    }
  },

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

  // Marca um convite como concluído (mútuo)
  async completeWorkoutInvite(inviteId) {
    try {
      const response = await api.put(`/chat/workout-invite/${inviteId}/complete`);
      return response.data;
    } catch (error) {
      // Se ainda não estiver no backend em alguns ambientes, propaga para fallback do caller decidir
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

  // Agregador: retorna convites aceitos como "próximos treinos"
  async getAcceptedWorkoutInvites({ matchesLimit = 20 } = {}) {
    try {
      const matches = await userService.getMatches({ limit: matchesLimit }).catch(() => []);
      const now = new Date();
      const items = [];
      for (const match of (matches || [])) {
        const matchId = match.id || match.matchId || match?.id;
        if (!matchId) continue;
        // Ler invites diretos e filtrar aceitos e futuros
        const invitesResp = await chatService.getMatchInvites(matchId);
        const invites = (invitesResp?.invites || [])
          .filter((i) => i.status === 'accepted')
          .filter((i) => i.date && i.time)
          .map((i) => ({
            id: i.id,
            date: i.date,
            time: i.time,
            address: i.address,
            latitude: i.latitude,
            longitude: i.longitude,
            inviterId: i.inviterId,
            inviteeId: i.inviteeId,
            status: i.status,
          }));

        for (const i of invites) {
          if (!i.date || !i.time) continue;
          const scheduledAt = new Date(`${i.date}T${i.time}:00`);
          if (!scheduledAt || Number.isNaN(scheduledAt.getTime()) || scheduledAt < now) continue;
          items.push({
            id: i.id,
            title: 'Treino agendado',
            scheduledAt,
            partner: { name: match?.user?.name || match?.otherUser?.name || 'Parceiro' },
            location: i.address ? { name: i.address } : null,
            latitude: typeof i.latitude === 'number' ? i.latitude : undefined,
            longitude: typeof i.longitude === 'number' ? i.longitude : undefined,
            workoutType: i.workoutType,
            inviterId: i.inviterId,
            inviteeId: i.inviteeId,
            matchId: i.matchId || matchId,
            status: i.status,
          });
        }
      }
      items.sort((a, b) => a.scheduledAt - b.scheduledAt);
      return items;
    } catch (error) {
      console.error('Error aggregating accepted workout invites:', error);
      return [];
    }
  },
};

