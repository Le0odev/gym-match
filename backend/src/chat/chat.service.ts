import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message, MessageStatus, MessageType, Match, MatchStatus, WorkoutInvite, WorkoutInviteStatus, User, Gym } from '../entities';
import { 
  SendMessageDto, 
  EditMessageDto, 
  MessageFiltersDto, 
  WorkoutInviteDto, 
  LocationShareDto 
} from '../dto/chat.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { GatewayService } from '../gateway/gateway.service';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(WorkoutInvite)
    private inviteRepository: Repository<WorkoutInvite>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Gym)
    private gymRepository: Repository<Gym>,
    private notificationsService: NotificationsService,
    private gatewayService: GatewayService,
  ) {}

  // Serialização como ISO UTC (com Z) para consistência com timestamptz
  private toUtcIso(date?: Date | null): string | null {
    if (!date) return null;
    return new Date(date).toISOString();
  }

  private serializeMessageForClient(message: Message) {
    if (!message) return message;
    return {
      ...message,
      createdAt: this.toUtcIso(message.createdAt) as any,
      updatedAt: this.toUtcIso(message.updatedAt) as any,
      readAt: this.toUtcIso(message.readAt) as any,
      deliveredAt: this.toUtcIso(message.deliveredAt) as any,
      editedAt: this.toUtcIso(message.editedAt) as any,
    };
  }

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

    // Enviar notificação com contexto do sender
    await this.notificationsService.notifyNewMessage(
      recipientId,
      userId,
      sendMessageDto.content
    );

    // Emitir evento em tempo real para ambos usuários
    const messageWithRelations = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: ['sender', 'recipient', 'replyTo'],
    });
    if (messageWithRelations) {
      const payload = this.serializeMessageForClient(messageWithRelations);
      this.gatewayService.emitToUser(recipientId, 'message:new', payload);
      this.gatewayService.emitToUser(userId, 'message:new', payload);
    }

    // Retornar mensagem com relações
    if (!messageWithRelations) {
      throw new NotFoundException('Message not found after creation');
    }

    return this.serializeMessageForClient(messageWithRelations as Message) as any;
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

    const chrono = messages.reverse();
    return {
      messages: chrono.map((m) => this.serializeMessageForClient(m)),
      total: chrono.length,
      hasMore: chrono.length === (filters.limit || 50),
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

    return this.serializeMessageForClient(message as Message) as any;
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
    const match = await this.matchRepository.findOne({ where: { id: inviteDto.matchId } });
    if (!match) throw new NotFoundException('Match not found');
    if (match.userAId !== userId && match.userBId !== userId) throw new ForbiddenException('No access');

    // Criar entidade de invite
    const invite = this.inviteRepository.create({
      matchId: inviteDto.matchId,
      inviterId: userId,
      inviteeId: match.userAId === userId ? match.userBId : match.userAId,
      workoutType: inviteDto.workoutType as any,
      date: inviteDto.date,
      time: inviteDto.time,
      gymId: inviteDto.gymId,
      address: inviteDto.location,
      latitude: inviteDto.latitude,
      longitude: inviteDto.longitude,
      status: WorkoutInviteStatus.PENDING,
    });
    const savedInvite = await this.inviteRepository.save(invite);

    const content = inviteDto.message || `Convite para treino de ${inviteDto.workoutType} em ${inviteDto.date} às ${inviteDto.time}`;
    const message = await this.sendMessage(userId, {
      matchId: inviteDto.matchId,
      type: MessageType.WORKOUT_INVITE,
      content,
      metadata: {
        inviteId: savedInvite.id,
        workoutType: savedInvite.workoutType,
        date: savedInvite.date,
        time: savedInvite.time,
        gymId: savedInvite.gymId,
        address: savedInvite.address,
        latitude: savedInvite.latitude,
        longitude: savedInvite.longitude,
        status: savedInvite.status,
      },
    });

    // Notificar socket
    this.gatewayService.emitToUser(invite.inviteeId, 'invite:new', { invite: savedInvite, message });
    this.gatewayService.emitToUser(invite.inviterId, 'invite:new', { invite: savedInvite, message });

    return this.serializeMessageForClient(message as Message) as any;
  }

  async updateWorkoutInviteStatus(userId: string, inviteId: string, status: 'accepted' | 'rejected' | 'canceled'): Promise<Message> {
    const invite = await this.inviteRepository.findOne({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException('Invite not found');

    const isInviter = invite.inviterId === userId;
    const isInvitee = invite.inviteeId === userId;

    if (status === 'canceled' && !isInviter) throw new ForbiddenException('Only inviter can cancel');
    if ((status === 'accepted' || status === 'rejected') && !isInvitee) throw new ForbiddenException('Only invitee can change this status');

    invite.status = status as WorkoutInviteStatus;
    const saved = await this.inviteRepository.save(invite);

    const statusText = status === 'accepted' ? 'Convite aceito' : status === 'rejected' ? 'Convite recusado' : 'Convite cancelado';
    const message = await this.sendMessage(userId, {
      matchId: invite.matchId,
      type: MessageType.WORKOUT_INVITE,
      content: statusText,
      metadata: {
        inviteId: invite.id,
        status: saved.status,
      },
    });

    const otherUserId = isInviter ? invite.inviteeId : invite.inviterId;
    this.gatewayService.emitToUser(otherUserId, 'invite:update', { invite: saved, message });
    this.gatewayService.emitToUser(userId, 'invite:update', { invite: saved, message });

    return this.serializeMessageForClient(message as Message) as any;
  }

  async completeWorkoutInvite(userId: string, inviteId: string) {
    const invite = await this.inviteRepository.findOne({ where: { id: inviteId } });
    if (!invite) throw new NotFoundException('Invite not found');
    // Qualquer participante pode marcar como concluído (ou somente participantes)
    const isParticipant = invite.inviterId === userId || invite.inviteeId === userId;
    if (!isParticipant) throw new ForbiddenException('No access');

    // Persistir status COMPLETED
    invite.status = WorkoutInviteStatus.COMPLETED as any;
    const saved = await this.inviteRepository.save(invite);

    // Enviar mensagem informativa
    const message = await this.sendMessage(userId, {
      matchId: invite.matchId,
      type: MessageType.WORKOUT_INVITE,
      content: 'Treino concluído',
      metadata: { inviteId: invite.id, status: 'completed' },
    });

    // Atualizar estatísticas dos dois participantes
    await this.incrementUserCompletedWorkouts(invite.inviterId);
    await this.incrementUserCompletedWorkouts(invite.inviteeId);

    // Emitir atualização
    const otherUserId = invite.inviterId === userId ? invite.inviteeId : invite.inviterId;
    this.gatewayService.emitToUser(otherUserId, 'invite:update', { invite: saved, message });
    this.gatewayService.emitToUser(userId, 'invite:update', { invite: saved, message });

    return saved;
  }

  private async incrementUserCompletedWorkouts(userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) return;
    (user as any).completedWorkouts = ((user as any).completedWorkouts || 0) + 1;
    await this.userRepository.save(user);
  }

  async getMatchInvites(userId: string, matchId: string) {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match || (match.userAId !== userId && match.userBId !== userId)) {
      throw new ForbiddenException('No access');
    }
    const invites = await this.inviteRepository.find({ where: { matchId }, order: { createdAt: 'DESC' } });
    return { invites, total: invites.length };
  }

  // Retorna sugestões de academias próximas ao ponto médio entre os usuários do match
  async getNearbyGymsForMatch(userId: string, matchId: string, radiusMeters: number = 5000, limit: number = 5) {
    const match = await this.matchRepository.findOne({ where: { id: matchId } });
    if (!match || (match.userAId !== userId && match.userBId !== userId)) {
      throw new ForbiddenException('No access');
    }

    const userA = await this.userRepository.findOne({ where: { id: match.userAId } });
    const userB = await this.userRepository.findOne({ where: { id: match.userBId } });

    if (!userA?.currentLocation || !userB?.currentLocation) {
      return { gyms: [], total: 0 };
    }

    // Ponto médio simples entre duas coordenadas (aprox.)
    // PostGIS: usar ST_LineInterpolatePoint(ST_MakeLine(ptA, ptB), 0.5)
    const qb = this.gymRepository.createQueryBuilder('gym')
      .where('gym.location IS NOT NULL')
      .andWhere('ST_DWithin(gym.location, ST_LineInterpolatePoint(ST_MakeLine(:ptA, :ptB), 0.5), :radius)')
      .setParameters({
        ptA: userA.currentLocation,
        ptB: userB.currentLocation,
        radius: radiusMeters,
      })
      .orderBy('ST_Distance(gym.location, ST_LineInterpolatePoint(ST_MakeLine(:ptA, :ptB), 0.5))')
      .setParameters({ ptA: userA.currentLocation, ptB: userB.currentLocation })
      .limit(limit);

    const gyms = await qb.getMany();
    return { gyms, total: gyms.length };
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

