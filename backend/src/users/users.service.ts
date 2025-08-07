import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, WorkoutPreference } from '../entities';
import { 
  UpdateUserDto, 
  UpdateLocationDto, 
  AddWorkoutPreferencesDto,
  UpdateProfileSettingsDto 
} from '../dto/user.dto';
import * as fs from 'fs';
import * as path from 'path';

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
      location: updateLocationDto.city && updateLocationDto.state 
        ? `${updateLocationDto.city}, ${updateLocationDto.state}`
        : user.location,
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

  async updateWorkoutPreferences(
    userId: string,
    workoutPreferenceIds: number[],
  ): Promise<User> {
    const user = await this.findById(userId);

    const workoutPreferences = await this.workoutPreferenceRepository.findByIds(
      workoutPreferenceIds,
    );

    user.workoutPreferences = workoutPreferences;

    return this.userRepository.save(user);
  }

  async getWorkoutPreferences(userId: string): Promise<WorkoutPreference[]> {
    const user = await this.findById(userId);
    return user.workoutPreferences;
  }

  // Novas funcionalidades para o app mobile
  async uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.findById(userId);

    // Criar diretório de uploads se não existir
    const uploadsDir = path.join(process.cwd(), 'uploads', 'profile-photos');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Gerar nome único para o arquivo
    const fileExtension = path.extname(file.originalname);
    const fileName = `${userId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Salvar arquivo
    fs.writeFileSync(filePath, file.buffer);

    // Atualizar URL da foto no banco
    const photoUrl = `/uploads/profile-photos/${fileName}`;
    user.profilePicture = photoUrl;

    return this.userRepository.save(user);
  }

  async updateProfilePhotoUrl(userId: string, photoUrl: string): Promise<User> {
    const user = await this.findById(userId);
    user.profilePicture = photoUrl;
    return this.userRepository.save(user);
  }

  async updateProfileSettings(userId: string, updateSettingsDto: UpdateProfileSettingsDto): Promise<User> {
    const user = await this.findById(userId);

    if (updateSettingsDto.notifications !== undefined) {
      user.notificationsEnabled = updateSettingsDto.notifications;
    }
    if (updateSettingsDto.darkMode !== undefined) {
      user.darkMode = updateSettingsDto.darkMode;
    }
    if (updateSettingsDto.showOnline !== undefined) {
      user.showOnline = updateSettingsDto.showOnline;
    }

    return this.userRepository.save(user);
  }

  async getUserStats(userId: string): Promise<{
    totalMatches: number;
    completedWorkouts: number;
    profileViews: number;
    joinedAt: Date;
  }> {
    const user = await this.findById(userId);
    
    return {
      totalMatches: user.totalMatches,
      completedWorkouts: user.completedWorkouts,
      profileViews: user.profileViews,
      joinedAt: user.createdAt,
    };
  }

  async incrementProfileViews(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.profileViews += 1;
    return this.userRepository.save(user);
  }

  async incrementCompletedWorkouts(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.completedWorkouts += 1;
    return this.userRepository.save(user);
  }

  async updateLastSeen(userId: string): Promise<User> {
    const user = await this.findById(userId);
    user.lastSeen = new Date();
    return this.userRepository.save(user);
  }

  async updateProfilePhoto(userId: string, photoUrl: string): Promise<User> {
    const user = await this.findById(userId);
    user.profilePicture = photoUrl;
    return this.userRepository.save(user);
  }

  private sanitizeUser(user: User) {
    const { password, ...result } = user;
    return result;
  }
}

