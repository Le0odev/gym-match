import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, WorkoutPreference } from '../entities';
import { UpdateUserDto, UpdateLocationDto, AddWorkoutPreferencesDto } from '../dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(WorkoutPreference)
    private workoutPreferenceRepository: Repository<WorkoutPreference>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['workoutPreferences', 'gym'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['workoutPreferences', 'gym'],
    });
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);

    Object.assign(user, updateUserDto);

    return this.userRepository.save(user);
  }

  async updateLocation(userId: string, updateLocationDto: UpdateLocationDto): Promise<User> {
    const user = await this.findById(userId);

    // Create PostGIS Point from latitude and longitude
    const point = `POINT(${updateLocationDto.longitude} ${updateLocationDto.latitude})`;

    await this.userRepository.update(userId, {
      currentLocation: point,
    });

    return this.findById(userId);
  }

  async addWorkoutPreferences(
    userId: string,
    addWorkoutPreferencesDto: AddWorkoutPreferencesDto,
  ): Promise<User> {
    const user = await this.findById(userId);

    const workoutPreferences = await this.workoutPreferenceRepository.findByIds(
      addWorkoutPreferencesDto.workoutPreferenceIds,
    );

    user.workoutPreferences = workoutPreferences;

    return this.userRepository.save(user);
  }

  async getWorkoutPreferences(userId: string): Promise<WorkoutPreference[]> {
    const user = await this.findById(userId);
    return user.workoutPreferences;
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}

