import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus, MessageType, Match, MatchStatus } from '../entities';
import { 
  SendMessageDto, 
  EditMessageDto, 
  MessageFiltersDto, 
  WorkoutInviteDto, 
  LocationShareDto 
} from '../dto/chat.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private notificationsService: NotificationsService,
  ) {}

  async sendMessage(userId: string, sendMessageDto: SendMessageDto): Promise<Message> {
    // Verificar se o match existe e o usuário tem permissão
    const match = await this.matchRepository.findOne({
      where: { id: sendMessageDto.matchId, status: MatchStatus.ACCEPTED },
      relations: ['userA', 'userB'],
    });

    if (!match) {
      throw new NotFoundException('Match not found or not accepted');
    }

    if (match.userAId !== userId && match.userBId !== userId) {
      throw new ForbiddenException('You are not part of this match');
    }

    const recipientId = match.userAId === userId ? match.userBId : match.userAId;

    // Criar mensagem
    const message = this.messageRepository.create({
      matchId: sendMessageDto.matchId,
      senderId: userId,
      recipientId,
      type: sendMessageDto.type,
      content: sendMessageDto.content,
      metadata: sendMessageDto.metadata,
      replyToId: sendMessageDto.replyToId,
      status: MessageStatus.SENT,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Atualizar informações do match
    await this.updateMatchLastMessage(match, savedMessage, userId);

    // Enviar notificação
    await this.notificationsService.notifyNewMessage(
      recipientId,
      userId,
      sendMessageDto.content
    );

    // Retornar mensagem com relações
    const messageWithRelations = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'recipient', 'replyTo'],
    });

    if (!messageWithRelations) {
      throw new NotFoundException('Message not found after creation');
    }

    return messageWithRelations;
  }

  async getMatchMessages(userId: string, matchId: string, filters: MessageFiltersDto = {}) {
    // Verificar se o usuário tem acesso ao match
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match || (match.userAId !== userId && match.userBId !== userId)) {
      throw new ForbiddenException('You do not have access to this match');
    }

    let query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.recipient', 'recipient')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .where('message.matchId = :matchId', { matchId });

    if (filters.type) {
      query = query.andWhere('message.type = :type', { type: filters.type });
    }

    if (filters.search) {
      query = query.andWhere('message.content ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    if (filters.before) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: filters.before },
      });
      if (beforeMessage) {
        query = query.andWhere('message.createdAt < :beforeDate', {
          beforeDate: beforeMessage.createdAt,
        });
      }
    }

    query = query
      .orderBy('message.createdAt', 'DESC')
      .skip(filters.offset || 0)
      .take(filters.limit || 50);

    const messages = await query.getMany();

    // Marcar mensagens como entregues
    await this.markMessagesAsDelivered(matchId, userId);

    return {
      messages: messages.reverse(), // Reverter para ordem cronológica
      total: messages.length,
      hasMore: messages.length === (filters.limit || 50),
    };
  }

  async markMessageAsRead(userId: string, messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, recipientId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.status !== MessageStatus.READ) {
      message.status = MessageStatus.READ;
      message.readAt = new Date();
      await this.messageRepository.save(message);

      await this.updateUnreadCount(message.matchId, userId);
    }

    return message;
  }

  async markAllMessagesAsRead(userId: string, matchId: string): Promise<void> {
    await this.messageRepository.update(
      { matchId, recipientId: userId, status: MessageStatus.DELIVERED },
      { 
        status: MessageStatus.READ,
        readAt: new Date(),
      }
    );

    // Resetar contador de não lidas
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (match) {
      if (match.userAId === userId) {
        match.unreadCountA = 0;
      } else {
        match.unreadCountB = 0;
      }
      await this.matchRepository.save(match);
    }
  }

  async editMessage(userId: string, messageId: string, editDto: EditMessageDto): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, senderId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found or you are not the sender');
    }

    // Só permite editar mensagens de texto
    if (message.type !== MessageType.TEXT) {
      throw new ForbiddenException('Only text messages can be edited');
    }

    message.content = editDto.content;
    message.isEdited = true;
    message.editedAt = new Date();

    return this.messageRepository.save(message);
  }

  async deleteMessage(userId: string, messageId: string): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, senderId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found or you are not the sender');
    }

    await this.messageRepository.remove(message);
  }

  async sendWorkoutInvite(userId: string, inviteDto: WorkoutInviteDto): Promise<Message> {
    const workoutData = {
      workoutType: inviteDto.workoutType,
      date: inviteDto.date,
      time: inviteDto.time,
      location: inviteDto.location,
    };

    const content = inviteDto.message || 
      `Convite para treino de ${inviteDto.workoutType} em ${inviteDto.date} às ${inviteDto.time}`;

    return this.sendMessage(userId, {
      matchId: inviteDto.matchId,
      type: MessageType.WORKOUT_INVITE,
      content,
      metadata: workoutData,
    });
  }

  async shareLocation(userId: string, locationDto: LocationShareDto): Promise<Message> {
    const locationData = {
      latitude: locationDto.latitude,
      longitude: locationDto.longitude,
      address: locationDto.address,
      placeName: locationDto.placeName,
    };

    const content = locationDto.placeName || locationDto.address || 'Localização compartilhada';

    return this.sendMessage(userId, {
      matchId: locationDto.matchId,
      type: MessageType.LOCATION,
      content,
      metadata: locationData,
    });
  }

  async getUnreadMessagesCount(userId: string): Promise<{ count: number }> {
    const count = await this.messageRepository.count({
      where: { 
        recipientId: userId, 
        status: MessageStatus.DELIVERED 
      },
    });

    return { count };
  }

  async getMatchUnreadCount(userId: string, matchId: string): Promise<{ count: number }> {
    const count = await this.messageRepository.count({
      where: { 
        matchId,
        recipientId: userId, 
        status: MessageStatus.DELIVERED 
      },
    });

    return { count };
  }

  async searchMessages(userId: string, query: string, limit: number = 20) {
    // Buscar apenas em matches do usuário
    const userMatches = await this.matchRepository.find({
      where: [
        { userAId: userId, status: MatchStatus.ACCEPTED },
        { userBId: userId, status: MatchStatus.ACCEPTED },
      ],
    });

    const matchIds = userMatches.map(match => match.id);

    if (matchIds.length === 0) {
      return { messages: [], total: 0 };
    }

    const messages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.match', 'match')
      .leftJoinAndSelect('match.userA', 'userA')
      .leftJoinAndSelect('match.userB', 'userB')
      .where('message.matchId IN (:...matchIds)', { matchIds })
      .andWhere('message.content ILIKE :query', { query: `%${query}%` })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return {
      messages,
      total: messages.length,
    };
  }

  private async updateMatchLastMessage(match: Match, message: Message, senderId: string): Promise<void> {
    match.lastMessageAt = new Date();
    match.lastMessagePreview = this.getMessagePreview(message);

    // Incrementar contador de não lidas para o destinatário
    if (match.userAId === senderId) {
      match.unreadCountB += 1;
    } else {
      match.unreadCountA += 1;
    }

    await this.matchRepository.save(match);
  }

  private async markMessagesAsDelivered(matchId: string, userId: string): Promise<void> {
    await this.messageRepository.update(
      { 
        matchId, 
        recipientId: userId, 
        status: MessageStatus.SENT 
      },
      { 
        status: MessageStatus.DELIVERED,
        deliveredAt: new Date(),
      }
    );
  }

  private async updateUnreadCount(matchId: string, userId: string): Promise<void> {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (match) {
      const unreadCount = await this.messageRepository.count({
        where: { 
          matchId, 
          recipientId: userId, 
          status: MessageStatus.DELIVERED 
        },
      });

      if (match.userAId === userId) {
        match.unreadCountA = unreadCount;
      } else {
        match.unreadCountB = unreadCount;
      }

      await this.matchRepository.save(match);
    }
  }

  private getMessagePreview(message: Message): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content.length > 100 
          ? `${message.content.substring(0, 100)}...` 
          : message.content;
      case MessageType.IMAGE:
        return '📷 Imagem';
      case MessageType.AUDIO:
        return '🎵 Áudio';
      case MessageType.LOCATION:
        return '📍 Localização';
      case MessageType.WORKOUT_INVITE:
        return '💪 Convite para treino';
      case MessageType.SYSTEM:
        return message.content;
      default:
        return 'Mensagem';
    }
  }
}

