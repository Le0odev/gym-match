import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { GatewayService } from '../gateway/gateway.service';
import { User, Match, MatchStatus, Message } from '../entities';
import { DiscoverUsersDto, MatchFiltersDto } from '../dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    private notificationsService: NotificationsService,
    private gatewayService: GatewayService,
  ) {}

  async discoverUsers(userId: string, filters: DiscoverUsersDto) {
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['workoutPreferences'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Coordenadas do usuário corrente para filtros geoespaciais (evita SRID 0)
    let currentLon: number | null = null;
    let currentLat: number | null = null;
    if (currentUser.currentLocation) {
      const raw = await this.userRepository
        .createQueryBuilder('u')
        .select('ST_X(u.currentLocation)', 'lon')
        .addSelect('ST_Y(u.currentLocation)', 'lat')
        .where('u.id = :userId', { userId })
        .getRawOne<{ lon: string; lat: string }>();
      if (raw) {
        currentLon = Number(raw.lon);
        currentLat = Number(raw.lat);
      }
    }

    // Excluir usuários com relacionamento já decidido (accepted/rejected/unmatched)
    const decidedStatuses = [
      MatchStatus.ACCEPTED,
      MatchStatus.REJECTED,
      MatchStatus.UNMATCHED,
    ];

    const decidedMatches = await this.matchRepository.find({
      where: [
        { userAId: userId, status: In(decidedStatuses) },
        { userBId: userId, status: In(decidedStatuses) },
      ],
    });

    const pendingILiked = await this.matchRepository.find({
      where: { userAId: userId, status: MatchStatus.PENDING },
    });

    const excludedUserIdsBase = [
      ...decidedMatches.map((match) =>
        match.userAId === userId ? match.userBId : match.userAId
      ),
      ...pendingILiked.map((match) => match.userBId),
    ];

    const incomingPending = await this.matchRepository.find({
      where: { userBId: userId, status: MatchStatus.PENDING },
      select: ['userAId'],
    });
    const incomingIdsRaw = incomingPending.map((m) => m.userAId);
    const uniqueExcludedBase = Array.from(new Set(excludedUserIdsBase));
    const incomingIds = incomingIdsRaw.filter((id) => !uniqueExcludedBase.includes(id));

    // Carregar usuários que deram like em você (incoming), sem geofiltro
    let incomingUsers: User[] = [];
    if (incomingIds.length > 0) {
      incomingUsers = await this.userRepository
        .createQueryBuilder('user')
        .select([
          'user.id',
          'user.email',
          'user.name',
          'user.height',
          'user.weight',
          'user.goal',
          'user.availableTime',
          'user.gymId',
          'user.profilePicture',
          'user.bio',
          'user.birthDate',
          'user.experienceLevel',
          'user.gender',
          'user.location',
          'user.notificationsEnabled',
          'user.darkMode',
          'user.showOnline',
          'user.lastSeen',
          'user.totalMatches',
          'user.completedWorkouts',
          'user.profileViews',
          'user.createdAt',
          'user.updatedAt',
        ])
        .leftJoinAndSelect('user.workoutPreferences', 'workoutPreferences')
        .leftJoinAndSelect('user.gym', 'gym')
        .where('user.id IN (:...incomingIds)', { incomingIds })
        .andWhere('user.id != :userId', { userId })
        .getMany();
    }

    // Build query base: proximidade + joins essenciais
    let query = this.userRepository
      .createQueryBuilder('user')
      .distinctOn(['user.id'])
      .select([
        'user.id',
        'user.email',
        'user.name',
        'user.height',
        'user.weight',
        'user.goal',
        'user.availableTime',
        'user.gymId',
        'user.profilePicture',
        'user.bio',
        'user.birthDate',
        'user.experienceLevel',
        'user.gender',
        'user.location',
        'user.notificationsEnabled',
        'user.darkMode',
        'user.showOnline',
        'user.lastSeen',
        'user.totalMatches',
        'user.completedWorkouts',
        'user.profileViews',
        'user.createdAt',
        'user.updatedAt',
      ])
      .leftJoinAndSelect('user.workoutPreferences', 'workoutPreferences')
      .leftJoinAndSelect('user.gym', 'gym')
      .where('user.id != :userId', { userId });

    const effectiveDistanceKm = (filters.distance as number) || 25;
    const excludedForQuery = Array.from(new Set([...uniqueExcludedBase, ...incomingIds]));
    let useGeoQuery = currentLon != null && currentLat != null;

    if (useGeoQuery) {
      query = query
        .andWhere('"user"."currentLocation" IS NOT NULL')
        .andWhere(
          `ST_DWithin("user"."currentLocation"::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography, :distance)`,
          { lon: currentLon, lat: currentLat, distance: effectiveDistanceKm * 1000 },
        )
        .addSelect(
          `ST_Distance("user"."currentLocation"::geography, ST_SetSRID(ST_MakePoint(:lon, :lat), 4326)::geography)`,
          'distance_m',
        );
    }

    // Nenhuma priorização especial: UX simples por distância

    // Filter by height range
    // Aplicar filtros SOMENTE quando fornecidos
    if (filters.workoutTypes && filters.workoutTypes.length > 0) {
      query = query.andWhere('workoutPreferences.id IN (:...workoutTypes)', { workoutTypes: filters.workoutTypes });
    } else if (filters.workoutType) {
      query = query.andWhere('workoutPreferences.id = :workoutType', { workoutType: filters.workoutType });
    }
    if (filters.minHeight) {
      query = query.andWhere('user.height >= :minHeight', { minHeight: filters.minHeight });
    }
    if (filters.maxHeight) {
      query = query.andWhere('user.height <= :maxHeight', { maxHeight: filters.maxHeight });
    }

    // Filter by weight range
    if (filters.minWeight) {
      query = query.andWhere('user.weight >= :minWeight', { minWeight: filters.minWeight });
    }
    if (filters.maxWeight) {
      query = query.andWhere('user.weight <= :maxWeight', { maxWeight: filters.maxWeight });
    }

    // Filter by experience level
    if (filters.experienceLevel) {
      query = query.andWhere('user.experienceLevel = :experienceLevel', { experienceLevel: filters.experienceLevel });
    }

    // Filter by gender
    if (filters.gender) {
      query = query.andWhere('user.gender = :gender', { gender: filters.gender });
    }

    // Filter by age range
    if (filters.minAge || filters.maxAge) {
      const currentDate = new Date();
      if (filters.maxAge) {
        const minBirthDate = new Date(currentDate.getFullYear() - filters.maxAge, 0, 1);
        query = query.andWhere('user.birthDate >= :minBirthDate', { minBirthDate });
      }
      if (filters.minAge) {
        const maxBirthDate = new Date(currentDate.getFullYear() - filters.minAge, 11, 31);
        query = query.andWhere('user.birthDate <= :maxBirthDate', { maxBirthDate });
      }
    }

    // Filter by city/state
    if (filters.city) {
      query = query.andWhere('user.location ILIKE :city', { city: `%${filters.city}%` });
    }

    if (filters.state) {
      query = query.andWhere('user.location ILIKE :state', { state: `%${filters.state}%` });
    }

    // Filter by gym
    if (filters.gymId) {
      query = query.andWhere('user.gymId = :gymId', { gymId: filters.gymId });
    }

    // Filter by online status
    if (filters.onlineOnly) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      query = query.andWhere('user.lastSeen >= :fiveMinutesAgo', { fiveMinutesAgo });
    }

    if (excludedForQuery.length > 0) {
      query = query.andWhere('user.id NOT IN (:...excludedUserIds)', { excludedUserIds: excludedForQuery });
    }

    // DISTINCT ON requer que o(s) campo(s) do DISTINCT seja(m) o(s) primeiro(s) do ORDER BY
    query = query.orderBy('user.id', 'ASC')
      .addOrderBy('distance_m', 'ASC', 'NULLS LAST')
      .skip(filters.offset || 0)
      .take(filters.limit || 20);

    let users: User[] = [];
    let raw: any[] = [];
    if (useGeoQuery) {
      const result = await query
        .orderBy('user.id', 'ASC')
        .addOrderBy('distance_m', 'ASC', 'NULLS LAST')
        .skip(filters.offset || 0)
        .take(filters.limit || 20)
        .getRawAndEntities();
      users = result.entities;
      raw = result.raw as any[];
    }

    let geoUsers = users.map((u, idx) => {
      const row = raw[idx] || {};
      const distanceMeters = row.distance_m != null ? Number(row.distance_m) : NaN;
      const distanceKm = Number.isFinite(distanceMeters) ? Math.round((distanceMeters / 1000) * 10) / 10 : undefined;
      (u as any).__distanceKm = distanceKm;
      return u;
    });

    const pendingIds = new Set(incomingIds);

    // Calcular compatibilidade e distância aparente
    // Merge incoming first
    const combinedUsersOrder = [
      ...incomingUsers,
      ...geoUsers,
    ];

    // Fallback quando não há localização ou nenhum resultado: sugestões por preferência/gym
    if (combinedUsersOrder.length === 0) {
      const suggestions = await this.getSuggestions(userId, filters.limit || 20);
      const suggestionsFiltered = suggestions.filter((u) => !uniqueExcludedBase.includes(u.id));
      const mapped = suggestionsFiltered.map((u: any) => ({
        ...u,
        distanceKm: (u as any).__distanceKm,
      }));
      return {
        users: mapped,
        total: mapped.length,
        hasMore: mapped.length === (filters.limit || 20),
      };
    }

    let usersWithCompatibility = combinedUsersOrder.map(user => ({
      ...user,
      compatibilityScore: this.calculateCompatibilityScore(currentUser, user),
      age: this.calculateAge(user.birthDate),
      distanceKm: (user as any).__distanceKm,
      incomingLike: pendingIds.has(user.id),
    }));

    // Reordena por distância asc (já foi calculado) e usa compatibilidade como desempate
    usersWithCompatibility = usersWithCompatibility.sort((a, b) => {
      if (a.incomingLike && !b.incomingLike) return -1;
      if (!a.incomingLike && b.incomingLike) return 1;
      const da = typeof a.distanceKm === 'number' ? a.distanceKm : Number.POSITIVE_INFINITY;
      const db = typeof b.distanceKm === 'number' ? b.distanceKm : Number.POSITIVE_INFINITY;
      if (da !== db) return da - db;
      return (b.compatibilityScore || 0) - (a.compatibilityScore || 0);
    });

    return {
      users: usersWithCompatibility,
      total: usersWithCompatibility.length,
      hasMore: usersWithCompatibility.length === (filters.limit || 20),
    };
  }

  async getNearbyUsers(userId: string, distance: number = 5) {
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!currentUser || !currentUser.currentLocation) {
      return { users: [], total: 0 };
    }

    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.workoutPreferences', 'workoutPreferences')
      .where('user.id != :userId', { userId })
      .andWhere(
        `ST_DWithin("user"."currentLocation"::geography, :userLocation::geography, :distance)`,
        {
          userLocation: currentUser.currentLocation,
          distance: distance * 1000,
        }
      )
      .orderBy(`ST_Distance("user"."currentLocation"::geography, :orderLocation::geography)`)
      .setParameters({ orderLocation: currentUser.currentLocation })
      .limit(20);

    const users = await query.getMany();

    return {
      users: users.map(user => ({
        ...user,
        distance: this.calculateDistance(currentUser, user),
      })),
      total: users.length,
    };
  }

  async getSuggestions(userId: string, limit: number = 10) {
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['workoutPreferences'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Get users with similar workout preferences
    const workoutPreferenceIds = currentUser.workoutPreferences?.map(wp => wp.id) || [];
    
    let query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.workoutPreferences', 'workoutPreferences')
      .leftJoinAndSelect('user.gym', 'gym')
      .where('user.id != :userId', { userId });

    if (workoutPreferenceIds.length > 0) {
      query = query.andWhere('workoutPreferences.id IN (:...workoutPreferenceIds)', {
        workoutPreferenceIds,
      });
    }

    // Exclude already matched users
    const existingMatches = await this.matchRepository.find({
      where: [
        { userAId: userId },
        { userBId: userId },
      ],
    });

    const excludedUserIds = existingMatches.map(match => 
      match.userAId === userId ? match.userBId : match.userAId
    );

    if (excludedUserIds.length > 0) {
      query = query.andWhere('user.id NOT IN (:...excludedUserIds)', {
        excludedUserIds,
      });
    }

    const users = await query.limit(limit).getMany();

    return users.map(user => ({
      ...user,
      compatibilityScore: this.calculateCompatibilityScore(currentUser, user),
      reason: this.getSuggestionReason(currentUser, user),
    }));
  }

  async likeUser(userAId: string, userBId: string, message?: string) {
    // Bloquear auto-match indevido quando não há localização persistida (ambos sem currentLocation)
    const [userA, userB] = await Promise.all([
      this.userRepository.findOne({ where: { id: userAId } }),
      this.userRepository.findOne({ where: { id: userBId } }),
    ]);
    if (!userA || !userB) {
      throw new NotFoundException('User not found');
    }

    // Se nenhum dos dois tem localização, mantém pending (evita match incorreto em contas novas)
    if (!userA.currentLocation && !userB.currentLocation) {
      return { matchStatus: 'pending', matchId: null, isNewMatch: false };
    }

    // Check if user B already liked user A
    const existingMatch = await this.matchRepository.findOne({
      where: {
        userAId: userBId,
        userBId: userAId,
        status: MatchStatus.PENDING,
      },
    });

    if (existingMatch) {
      // It's a match! Update status to accepted
      // Aceitar somente se ambos têm localização e estão próximos (ex.: 100km)
      const canAutoAccept = await this.areUsersWithinDistanceKm(userAId, userBId, 100);
      if (!canAutoAccept) {
        // Mantém como pending e notifica o destinatário de que há um like (não é match)
        this.gatewayService.emitToUser(userBId, 'match:new', { matchId: existingMatch.id, status: 'pending', fromUserId: userAId });
        return { matchStatus: 'pending', matchId: existingMatch.id, isNewMatch: false };
      }
      existingMatch.status = MatchStatus.ACCEPTED;
      if (message) {
        existingMatch.initialMessage = message;
      }
      await this.matchRepository.save(existingMatch);

      // Update match count for both users
      await this.updateUserMatchCount(userAId);
      await this.updateUserMatchCount(userBId);

      // Emitir evento realtime para ambos os usuários
      this.gatewayService.emitToUser(userAId, 'match:update', { matchId: existingMatch.id, status: 'accepted' });
      this.gatewayService.emitToUser(userBId, 'match:update', { matchId: existingMatch.id, status: 'accepted' });

      // Notificar ambos (push/in-app)
      try {
        await this.notificationsService.notifyNewMatch(userAId, userBId, existingMatch.id);
      } catch (_) {}

      return { matchStatus: 'accepted', matchId: existingMatch.id, isNewMatch: true };
    } else {
      // Create new pending match
      const compatibilityResult = await this.getCompatibilityScore(userAId, userBId);
      const newMatch = this.matchRepository.create({
        userAId,
        userBId,
        status: MatchStatus.PENDING,
        compatibilityScore: compatibilityResult.score,
        initialMessage: message,
      });

      await this.matchRepository.save(newMatch);

      // Emite evento de like/pending para o destinatário (para UI opcional)
      this.gatewayService.emitToUser(userBId, 'match:new', { matchId: newMatch.id, status: 'pending', fromUserId: userAId });

      return { matchStatus: 'pending', matchId: newMatch.id, isNewMatch: false };
    }
  }

  private async areUsersWithinDistanceKm(userAId: string, userBId: string, km: number): Promise<boolean> {
    const rows = await this.userRepository
      .createQueryBuilder('ua')
      .select(
        `ST_Distance("ua"."currentLocation"::geography, "ub"."currentLocation"::geography)`,
        'dist_m',
      )
      .innerJoin(User, 'ub', 'ub.id = :userBId', { userBId })
      .where('ua.id = :userAId', { userAId })
      .andWhere('"ua"."currentLocation" IS NOT NULL')
      .andWhere('"ub"."currentLocation" IS NOT NULL')
      .getRawOne<{ dist_m: string }>();
    if (!rows || rows.dist_m == null) return false;
    const meters = Number(rows.dist_m);
    if (Number.isNaN(meters)) return false;
    return meters <= km * 1000;
  }

  async superLikeUser(userAId: string, userBId: string, message?: string) {
    const result = await this.likeUser(userAId, userBId, message);
    
    // Mark as super like for higher visibility
    if (result.matchId) {
      await this.matchRepository.update(result.matchId, {
        isSuperLike: true,
      });
    }

    return { ...result, isSuperLike: true };
  }

  async skipUser(userAId: string, userBId: string, reason?: string) {
    // Create a rejected match to prevent showing this user again
    const skipMatch = this.matchRepository.create({
      userAId,
      userBId,
      status: MatchStatus.REJECTED,
      skipReason: reason,
    });

    await this.matchRepository.save(skipMatch);
    return { status: 'ok' };
  }

  async getUserMatches(userId: string, filters: MatchFiltersDto = {}) {
    let query = this.matchRepository
      .createQueryBuilder('match')
      .leftJoinAndSelect('match.userA', 'userA')
      .leftJoinAndSelect('match.userB', 'userB')
      .leftJoinAndSelect('userA.workoutPreferences', 'userAPrefs')
      .leftJoinAndSelect('userB.workoutPreferences', 'userBPrefs')
      .where('match.status = :status', { status: MatchStatus.ACCEPTED })
      .andWhere('(match.userAId = :userId OR match.userBId = :userId)', { userId });

    // Filter by recent matches
    if (filters.recentOnly) {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query = query.andWhere('match.createdAt >= :sevenDaysAgo', { sevenDaysAgo });
    }

    // Search by name
    if (filters.search) {
      query = query.andWhere(
        '(userA.name ILIKE :search OR userB.name ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Apply pagination
    query = query
      .skip(filters.offset || 0)
      .take(filters.limit || 20)
      .orderBy('match.createdAt', 'DESC');

    const matches = await query.getMany();

    // Buscar última mensagem (enviada ou recebida) de todos os matches em uma consulta
    const matchIds = matches.map((m) => m.id);
    let lastMessagesByMatch = new Map<string, Message>();
    if (matchIds.length > 0) {
      const lastMessages = await this.messageRepository
        .createQueryBuilder('message')
        .distinctOn(['message.matchId'])
        .where('message.matchId IN (:...matchIds)', { matchIds })
        .orderBy('message.matchId', 'ASC')
        .addOrderBy('message.createdAt', 'DESC')
        .getMany();
      lastMessages.forEach((msg) => lastMessagesByMatch.set(msg.matchId, msg));
    }

    const items = matches.map(match => {
      const lastMsg = lastMessagesByMatch.get(match.id);
      const otherUser = match.userAId === userId ? match.userB : match.userA;
      return {
        matchId: match.id,
        user: otherUser,
        status: match.status,
        compatibilityScore: match.compatibilityScore,
        isSuperLike: match.isSuperLike,
        initialMessage: match.initialMessage,
        createdAt: match.createdAt,
        lastMessageAt: lastMsg?.createdAt ?? match.lastMessageAt,
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              content: lastMsg.content,
              type: lastMsg.type,
              createdAt: lastMsg.createdAt,
              senderId: lastMsg.senderId,
              recipientId: lastMsg.recipientId,
            }
          : undefined,
        unreadCount: match.userAId === userId ? match.unreadCountA : match.unreadCountB,
      };
    });

    return {
      matches: items,
      total: items.length,
      hasMore: items.length === (filters.limit || 20),
    };
  }

  async getMatchStats(userId: string) {
    const totalMatches = await this.matchRepository.count({
      where: [
        { userAId: userId, status: MatchStatus.ACCEPTED },
        { userBId: userId, status: MatchStatus.ACCEPTED },
      ],
    });

    const totalLikes = await this.matchRepository.count({
      where: { userAId: userId },
    });

    const totalLikesReceived = await this.matchRepository.count({
      where: { userBId: userId },
    });

    const recentMatches = await this.matchRepository.count({
      where: [
        { userAId: userId, status: MatchStatus.ACCEPTED },
        { userBId: userId, status: MatchStatus.ACCEPTED },
      ],
      // Add date filter for last 30 days
    });

    return {
      totalMatches,
      totalLikes,
      totalLikesReceived,
      recentMatches,
      matchRate: totalLikes > 0 ? (totalMatches / totalLikes) * 100 : 0,
    };
  }

  async getCompatibilityScore(userAId: string, userBId: string) {
    const userA = await this.userRepository.findOne({
      where: { id: userAId },
      relations: ['workoutPreferences'],
    });

    const userB = await this.userRepository.findOne({
      where: { id: userBId },
      relations: ['workoutPreferences'],
    });

    if (!userA || !userB) {
      return { score: 0, factors: [] };
    }

    const score = this.calculateCompatibilityScore(userA, userB);
    const factors = this.getCompatibilityFactors(userA, userB);

    return { score, factors };
  }

  async unmatch(userId: string, matchId: string) {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match || (match.userAId !== userId && match.userBId !== userId)) {
      throw new NotFoundException('Match not found');
    }

    match.status = MatchStatus.UNMATCHED;
    match.unmatchedAt = new Date();
    match.unmatchedBy = userId;

    await this.matchRepository.save(match);

    // Update match count for both users
    await this.updateUserMatchCount(match.userAId);
    await this.updateUserMatchCount(match.userBId);

    return { status: 'ok' };
  }

  async getSavedFilters(userId: string) {
    // This would typically be stored in a separate table
    // For now, return default filters
    return {
      distance: 10,
      minAge: 18,
      maxAge: 35,
      workoutTypes: [],
    };
  }

  async saveFilters(userId: string, filters: DiscoverUsersDto) {
    // This would typically save to a user_filters table
    // For now, just return success
    return { status: 'ok', filters };
  }

  private calculateCompatibilityScore(userA: User, userB: User): number {
    let score = 0;

    // Base score
    score += 50;

    // Workout preferences compatibility (30 points max)
    const commonWorkouts = userA.workoutPreferences?.filter(prefA =>
      userB.workoutPreferences?.some(prefB => prefB.id === prefA.id)
    ) || [];
    score += Math.min(commonWorkouts.length * 10, 30);

    // Experience level compatibility (10 points max)
    if (userA.experienceLevel && userB.experienceLevel) {
      if (userA.experienceLevel === userB.experienceLevel) {
        score += 10;
      } else {
        score += 5; // Different but still compatible
      }
    }

    // Age compatibility (10 points max)
    if (userA.birthDate && userB.birthDate) {
      const ageA = this.calculateAge(userA.birthDate);
      const ageB = this.calculateAge(userB.birthDate);
      const ageDiff = Math.abs(ageA - ageB);
      
      if (ageDiff <= 3) score += 10;
      else if (ageDiff <= 7) score += 5;
    }

    return Math.min(score, 100);
  }

  private getCompatibilityFactors(userA: User, userB: User): string[] {
    const factors: string[] = [];

    // Common workout preferences
    const commonWorkouts = userA.workoutPreferences?.filter(prefA =>
      userB.workoutPreferences?.some(prefB => prefB.id === prefA.id)
    ) || [];

    if (commonWorkouts.length > 0) {
      factors.push(`${commonWorkouts.length} preferências de treino em comum`);
    }

    // Same gym
    if (userA.gymId && userB.gymId && userA.gymId === userB.gymId) {
      factors.push('Mesma academia');
    }

    // Similar experience level
    if (userA.experienceLevel && userB.experienceLevel && userA.experienceLevel === userB.experienceLevel) {
      factors.push('Mesmo nível de experiência');
    }

    // Similar age
    if (userA.birthDate && userB.birthDate) {
      const ageA = this.calculateAge(userA.birthDate);
      const ageB = this.calculateAge(userB.birthDate);
      const ageDiff = Math.abs(ageA - ageB);
      
      if (ageDiff <= 3) {
        factors.push('Idades similares');
      }
    }

    return factors;
  }

  private getSuggestionReason(userA: User, userB: User): string {
    const commonWorkouts = userA.workoutPreferences?.filter(prefA =>
      userB.workoutPreferences?.some(prefB => prefB.id === prefA.id)
    ) || [];

    if (commonWorkouts.length > 0) {
      return `Vocês têm ${commonWorkouts.length} preferências de treino em comum`;
    }

    if (userA.gymId && userB.gymId && userA.gymId === userB.gymId) {
      return 'Vocês frequentam a mesma academia';
    }

    return 'Perfil compatível com suas preferências';
  }

  private calculateAge(birthDate: Date): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  private calculateDistance(userA: User, userB: User): number {
    // This would use PostGIS ST_Distance function in a real implementation
    // For now, return a placeholder
    return 0;
  }

  private async updateUserMatchCount(userId: string) {
    const matchCount = await this.matchRepository.count({
      where: [
        { userAId: userId, status: MatchStatus.ACCEPTED },
        { userBId: userId, status: MatchStatus.ACCEPTED },
      ],
    });

    await this.userRepository.update(userId, { totalMatches: matchCount });
  }
}

