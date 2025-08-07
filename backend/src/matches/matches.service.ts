import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Match, MatchStatus } from '../entities';
import { DiscoverUsersDto, MatchFiltersDto } from '../dto/match.dto';

@Injectable()
export class MatchesService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
  ) {}

  async discoverUsers(userId: string, filters: DiscoverUsersDto) {
    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['workoutPreferences'],
    });

    if (!currentUser) {
      throw new NotFoundException('User not found');
    }

    // Build query to find compatible users
    let query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.workoutPreferences', 'workoutPreferences')
      .leftJoinAndSelect('user.gym', 'gym')
      .where('user.id != :userId', { userId });

    // Filter by location if user has location
    if (currentUser.currentLocation && filters.distance) {
      query = query.andWhere(
        `ST_DWithin(user.currentLocation, :userLocation, :distance)`,
        {
          userLocation: currentUser.currentLocation,
          distance: filters.distance * 1000, // Convert km to meters
        }
      );
    }

    // Filter by workout types (multiple)
    if (filters.workoutTypes && filters.workoutTypes.length > 0) {
      query = query.andWhere('workoutPreferences.id IN (:...workoutTypes)', {
        workoutTypes: filters.workoutTypes,
      });
    } else if (filters.workoutType) {
      query = query.andWhere('workoutPreferences.id = :workoutType', {
        workoutType: filters.workoutType,
      });
    }

    // Filter by height range
    if (filters.minHeight) {
      query = query.andWhere('user.height >= :minHeight', {
        minHeight: filters.minHeight,
      });
    }
    if (filters.maxHeight) {
      query = query.andWhere('user.height <= :maxHeight', {
        maxHeight: filters.maxHeight,
      });
    }

    // Filter by weight range
    if (filters.minWeight) {
      query = query.andWhere('user.weight >= :minWeight', {
        minWeight: filters.minWeight,
      });
    }
    if (filters.maxWeight) {
      query = query.andWhere('user.weight <= :maxWeight', {
        maxWeight: filters.maxWeight,
      });
    }

    // Filter by experience level
    if (filters.experienceLevel) {
      query = query.andWhere('user.experienceLevel = :experienceLevel', {
        experienceLevel: filters.experienceLevel,
      });
    }

    // Filter by gender
    if (filters.gender) {
      query = query.andWhere('user.gender = :gender', {
        gender: filters.gender,
      });
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
      query = query.andWhere('user.location ILIKE :city', {
        city: `%${filters.city}%`,
      });
    }

    if (filters.state) {
      query = query.andWhere('user.location ILIKE :state', {
        state: `%${filters.state}%`,
      });
    }

    // Filter by gym
    if (filters.gymId) {
      query = query.andWhere('user.gymId = :gymId', {
        gymId: filters.gymId,
      });
    }

    // Filter by online status
    if (filters.onlineOnly) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      query = query.andWhere('user.lastSeen >= :fiveMinutesAgo', { fiveMinutesAgo });
    }

    // Exclude users already matched or skipped
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

    // Apply pagination
    query = query
      .skip(filters.offset || 0)
      .take(filters.limit || 20);

    const users = await query.getMany();

    // Calculate compatibility score for each user
    const usersWithCompatibility = users.map(user => ({
      ...user,
      compatibilityScore: this.calculateCompatibilityScore(currentUser, user),
      age: this.calculateAge(user.birthDate),
      distance: this.calculateDistance(currentUser, user),
    }));

    // Sort by compatibility score
    usersWithCompatibility.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

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
        `ST_DWithin(user.currentLocation, :userLocation, :distance)`,
        {
          userLocation: currentUser.currentLocation,
          distance: distance * 1000,
        }
      )
      .orderBy(`ST_Distance(user.currentLocation, '${currentUser.currentLocation}')`)
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
      existingMatch.status = MatchStatus.ACCEPTED;
      if (message) {
        existingMatch.initialMessage = message;
      }
      await this.matchRepository.save(existingMatch);

      // Update match count for both users
      await this.updateUserMatchCount(userAId);
      await this.updateUserMatchCount(userBId);

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
      return { matchStatus: 'pending', matchId: newMatch.id, isNewMatch: false };
    }
  }

  async superLikeUser(userAId: string, userBId: string, message?: string) {
    const result = await this.likeUser(userAId, userBId, message);
    
    // Mark as super like for higher visibility
    await this.matchRepository.update(result.matchId, {
      isSuperLike: true,
    });

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

    return {
      matches: matches.map(match => ({
        matchId: match.id,
        user: match.userAId === userId ? match.userB : match.userA,
        status: match.status,
        compatibilityScore: match.compatibilityScore,
        isSuperLike: match.isSuperLike,
        initialMessage: match.initialMessage,
        createdAt: match.createdAt,
        lastMessageAt: match.lastMessageAt,
        unreadCount: match.userAId === userId ? match.unreadCountA : match.unreadCountB,
      })),
      total: matches.length,
      hasMore: matches.length === (filters.limit || 20),
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

