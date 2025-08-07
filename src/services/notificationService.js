import api from './api';

export const notificationService = {
  // Gerenciamento de tokens push
  async registerPushToken(tokenData) {
    try {
      const response = await api.post('/notifications/register-token', tokenData);
      return response.data;
    } catch (error) {
      console.error('Error registering push token:', error);
      throw error;
    }
  },

  // Notificações do usuário
  async getNotifications(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const response = await api.get(`/notifications?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  },

  async getUnreadCount() {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/mark-all-read');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  // Configurações de notificação
  async getNotificationSettings() {
    try {
      const response = await api.get('/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Error getting notification settings:', error);
      throw error;
    }
  },

  async updateNotificationSettings(settings) {
    try {
      const response = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Teste de notificação
  async testPushNotification() {
    try {
      const response = await api.post('/notifications/test-push');
      return response.data;
    } catch (error) {
      console.error('Error testing push notification:', error);
      throw error;
    }
  },
};

