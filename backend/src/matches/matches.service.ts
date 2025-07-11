import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Match, MatchStatus } from '../entities';
import { DiscoverUsersDto } from '../dto/match.dto';

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

    // Filter by workout type
    if (filters.workoutType) {
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

    const users = await query.limit(10).getMany();

    // Calculate compatibility score for each user
    const usersWithCompatibility = users.map(user => ({
      ...user,
      compatibilityScore: this.calculateCompatibilityScore(currentUser, user),
    }));

    // Sort by compatibility score
    usersWithCompatibility.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return usersWithCompatibility;
  }

  async likeUser(userAId: string, userBId: string) {
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
      await this.matchRepository.save(existingMatch);
      return { matchStatus: 'accepted', matchId: existingMatch.id };
    } else {
      // Create new pending match
      const newMatch = this.matchRepository.create({
        userAId,
        userBId,
        status: MatchStatus.PENDING,
        compatibilityScore: await this.getCompatibilityScore(userAId, userBId),
      });

      await this.matchRepository.save(newMatch);
      return { matchStatus: 'pending', matchId: newMatch.id };
    }
  }

  async skipUser(userAId: string, userBId: string) {
    // Create a rejected match to prevent showing this user again
    const skipMatch = this.matchRepository.create({
      userAId,
      userBId,
      status: MatchStatus.REJECTED,
    });

    await this.matchRepository.save(skipMatch);
    return { status: 'ok' };
  }

  async getUserMatches(userId: string) {
    const matches = await this.matchRepository.find({
      where: [
        { userAId: userId, status: MatchStatus.ACCEPTED },
        { userBId: userId, status: MatchStatus.ACCEPTED },
      ],
      relations: ['userA', 'userB'],
    });

    return matches.map(match => ({
      matchId: match.id,
      user: match.userAId === userId ? match.userB : match.userA,
      status: match.status,
      compatibilityScore: match.compatibilityScore,
      createdAt: match.createdAt,
    }));
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

    // Height compatibility (10 points max)
    if (userA.height && userB.height) {
      const heightDiff = Math.abs(userA.height - userB.height);
      if (heightDiff <= 10) score += 10;
      else if (heightDiff <= 20) score += 5;
    }

    // Weight compatibility (10 points max)
    if (userA.weight && userB.weight) {
      const weightDiff = Math.abs(userA.weight - userB.weight);
      if (weightDiff <= 10) score += 10;
      else if (weightDiff <= 20) score += 5;
    }

    return Math.min(score, 100);
  }

  private async getCompatibilityScore(userAId: string, userBId: string): Promise<number> {
    const userA = await this.userRepository.findOne({
      where: { id: userAId },
      relations: ['workoutPreferences'],
    });

    const userB = await this.userRepository.findOne({
      where: { id: userBId },
      relations: ['workoutPreferences'],
    });

    if (!userA || !userB) return 0;

    return this.calculateCompatibilityScore(userA, userB);
  }
}

