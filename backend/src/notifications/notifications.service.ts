import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationStatus, PushToken, DeviceType } from '../entities';
import { 
  RegisterPushTokenDto, 
  SendNotificationDto, 
  BulkNotificationDto, 
  NotificationFiltersDto,
  UpdateNotificationDto 
} from '../dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(PushToken)
    private pushTokenRepository: Repository<PushToken>,
  ) {}

  async registerPushToken(userId: string, registerDto: RegisterPushTokenDto): Promise<PushToken> {
    // Desativar tokens antigos do mesmo dispositivo
    if (registerDto.deviceId) {
      await this.pushTokenRepository.update(
        { userId, deviceId: registerDto.deviceId },
        { isActive: false }
      );
    }

    // Verificar se o token já existe
    const existingToken = await this.pushTokenRepository.findOne({
      where: { token: registerDto.token },
    });

    // Normalizar deviceType se vier como string solta
    const normalizedDeviceType = ((): DeviceType | undefined => {
      if (!registerDto.deviceType) return undefined;
      if (typeof registerDto.deviceType === 'string') {
        const v = registerDto.deviceType.toLowerCase();
        if (v === 'ios') return DeviceType.IOS;
        if (v === 'android') return DeviceType.ANDROID;
        if (v === 'web') return DeviceType.WEB;
        return undefined;
      }
      return registerDto.deviceType;
    })();

    if (existingToken) {
      // Atualizar token existente
      existingToken.userId = userId;
      existingToken.isActive = true;
      existingToken.lastUsed = new Date();
      if (normalizedDeviceType) existingToken.deviceType = normalizedDeviceType;
      if (registerDto.deviceId) existingToken.deviceId = registerDto.deviceId;
      if (registerDto.appVersion) existingToken.appVersion = registerDto.appVersion;
      
      return this.pushTokenRepository.save(existingToken);
    }

    // Criar novo token (somente campos existentes na entidade)
    const pushToken = this.pushTokenRepository.create({
      userId,
      token: registerDto.token,
      deviceType: normalizedDeviceType ?? DeviceType.ANDROID,
      deviceId: registerDto.deviceId,
      appVersion: registerDto.appVersion,
      isActive: true,
      lastUsed: new Date(),
    });

    return this.pushTokenRepository.save(pushToken);
  }

  async sendNotification(sendDto: SendNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: sendDto.userId,
      type: sendDto.type,
      title: sendDto.title,
      message: sendDto.message,
      data: sendDto.data,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Enviar push notification se solicitado
    if (sendDto.sendPush) {
      await this.sendPushNotification(savedNotification);
    }

    return savedNotification;
  }

  async sendBulkNotification(bulkDto: BulkNotificationDto): Promise<Notification[]> {
    const notifications = bulkDto.userIds.map(userId => 
      this.notificationRepository.create({
        userId,
        type: bulkDto.type,
        title: bulkDto.title,
        message: bulkDto.message,
        data: bulkDto.data,
      })
    );

    const savedNotifications = await this.notificationRepository.save(notifications);

    // Enviar push notifications se solicitado
    if (bulkDto.sendPush) {
      await Promise.all(
        savedNotifications.map(notification => 
          this.sendPushNotification(notification)
        )
      );
    }

    return savedNotifications;
  }

  async getUserNotifications(userId: string, filters: NotificationFiltersDto = {}) {
    let query = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId });

    if (filters.type) {
      query = query.andWhere('notification.type = :type', { type: filters.type });
    }

    if (filters.unreadOnly) {
      query = query.andWhere('notification.status = :status', { 
        status: NotificationStatus.UNREAD 
      });
    }

    query = query
      .orderBy('notification.createdAt', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 20);

    const notifications = await query.getMany();

    return {
      notifications,
      total: notifications.length,
      hasMore: notifications.length === (filters.limit || 20),
    };
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    notification.readAt = new Date();

    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, status: NotificationStatus.UNREAD },
      { 
        status: NotificationStatus.READ,
        readAt: new Date(),
      }
    );
  }

  async deleteNotification(userId: string, notificationId: string): Promise<void> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await this.notificationRepository.count({
      where: { userId, status: NotificationStatus.UNREAD },
    });

    return { count };
  }

  async updateNotificationSettings(userId: string, settings: any): Promise<void> {
    // Esta funcionalidade seria implementada em uma tabela de configurações
    // Por enquanto, apenas retorna sucesso
  }

  async getNotificationSettings(userId: string): Promise<any> {
    // Esta funcionalidade seria implementada em uma tabela de configurações
    // Por enquanto, retorna configurações padrão
    return {
      matches: true,
      messages: true,
      likes: true,
      workoutReminders: true,
      profileViews: false,
      system: true,
    };
  }

  // Métodos de conveniência para tipos específicos de notificação
  async notifyNewMatch(userAId: string, userBId: string, matchId: string): Promise<void> {
    await Promise.all([
      this.sendNotification({
        userId: userAId,
        type: NotificationType.MATCH,
        title: 'Novo Match! 🎉',
        message: 'Vocês deram match! Que tal começar uma conversa?',
        data: { matchId, userId: userBId },
        sendPush: true,
      }),
      this.sendNotification({
        userId: userBId,
        type: NotificationType.MATCH,
        title: 'Novo Match! 🎉',
        message: 'Vocês deram match! Que tal começar uma conversa?',
        data: { matchId, userId: userAId },
        sendPush: true,
      }),
    ]);
  }

  async notifyNewMessage(recipientId: string, senderId: string, message: string): Promise<void> {
    // Incluir dados do remetente para permitir exibir avatar/nome no app
    const sender = await this.notificationRepository.manager.findOne('users', { where: { id: senderId } as any });
    const senderPublic = sender ? {
      id: sender.id,
      name: sender.name,
      profilePicture: sender.profilePicture,
    } : undefined;

    await this.sendNotification({
      userId: recipientId,
      type: NotificationType.MESSAGE,
      title: 'Nova mensagem 💬',
      message: message.length > 50 ? `${message.substring(0, 50)}...` : message,
      data: { senderId, sender: senderPublic },
      sendPush: true,
    });
  }

  async notifyLike(recipientId: string, senderId: string, isSuperLike: boolean = false): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      type: isSuperLike ? NotificationType.SUPER_LIKE : NotificationType.LIKE,
      title: isSuperLike ? 'Super Like! ⭐' : 'Alguém curtiu você! 💙',
      message: isSuperLike 
        ? 'Você recebeu um Super Like! Veja quem foi.'
        : 'Alguém demonstrou interesse em você. Que tal dar uma olhada?',
      data: { senderId },
      sendPush: true,
    });
  }

  async notifyProfileView(recipientId: string, viewerId: string): Promise<void> {
    await this.sendNotification({
      userId: recipientId,
      type: NotificationType.PROFILE_VIEW,
      title: 'Visualização do perfil 👀',
      message: 'Alguém visualizou seu perfil recentemente.',
      data: { viewerId },
      sendPush: false, // Não enviar push para visualizações
    });
  }

  async notifyWorkoutReminder(userId: string, workoutType: string): Promise<void> {
    await this.sendNotification({
      userId,
      type: NotificationType.WORKOUT_REMINDER,
      title: 'Hora do treino! 💪',
      message: `Não esqueça do seu treino de ${workoutType} hoje!`,
      data: { workoutType },
      sendPush: true,
    });
  }

  private async sendPushNotification(notification: Notification): Promise<void> {
    try {
      // Buscar tokens ativos do usuário
      const pushTokens = await this.pushTokenRepository.find({
        where: { userId: notification.userId, isActive: true },
      });

      if (pushTokens.length === 0) {
        return;
      }

      // Aqui seria implementada a integração com serviços de push notification
      // como Firebase Cloud Messaging (FCM) ou Apple Push Notification Service (APNs)
      
      // Exemplo de payload para FCM:
      const payload = {
        notification: {
          title: notification.title,
          body: notification.message,
        },
        data: {
          notificationId: notification.id,
          type: notification.type,
          ...notification.data,
        },
      };

      // Simular envio bem-sucedido
      notification.pushSent = true;
      notification.sentAt = new Date();
      await this.notificationRepository.save(notification);

      // Atualizar último uso dos tokens
      await Promise.all(
        pushTokens.map(token => {
          token.lastUsed = new Date();
          return this.pushTokenRepository.save(token);
        })
      );

      console.log(`Push notification sent to ${pushTokens.length} devices for user ${notification.userId}`);
      
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }
}

