import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { WorkoutPreference } from './workout-preference.entity';
import { Gym } from './gym.entity';
import { Match } from './match.entity';
import { RefreshToken } from './refresh-token.entity';

export enum ExperienceLevel {
  BEGINNER = 'Iniciante',
  INTERMEDIATE = 'Intermediário',
  ADVANCED = 'Avançado',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column()
  name: string;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  height: number;

  @Column('decimal', { precision: 5, scale: 2, nullable: true })
  weight: number;

  @Column({ nullable: true })
  goal: string;

  @Column({ name: 'available_time', nullable: true })
  availableTime: string;

  @Column({
    type: 'geometry',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  currentLocation: string;

  @Column({ name: 'gym_id', nullable: true })
  gymId: string;

  // Novos campos para o app mobile
  @Column({ name: 'profile_picture', nullable: true })
  profilePicture: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ name: 'birth_date', type: 'date', nullable: true })
  birthDate: Date;

  @Column({
    type: 'enum',
    enum: ExperienceLevel,
    name: 'experience_level',
    nullable: true,
  })
  experienceLevel: ExperienceLevel;

  @Column({
    type: 'enum',
    enum: Gender,
    nullable: true,
  })
  gender: Gender;

  @Column({ nullable: true })
  location: string;

  // Configurações do perfil
  @Column({ name: 'notifications_enabled', default: true })
  notificationsEnabled: boolean;

  @Column({ name: 'dark_mode', default: false })
  darkMode: boolean;

  @Column({ name: 'show_online', default: true })
  showOnline: boolean;

  @Column({ name: 'last_seen', type: 'timestamp', nullable: true })
  lastSeen: Date;

  // Estatísticas
  @Column({ name: 'total_matches', default: 0 })
  totalMatches: number;

  @Column({ name: 'completed_workouts', default: 0 })
  completedWorkouts: number;

  @Column({ name: 'profile_views', default: 0 })
  profileViews: number;

  @ManyToOne(() => Gym, { nullable: true })
  gym: Gym;

  @ManyToMany(() => WorkoutPreference)
  @JoinTable({
    name: 'user_workout_preferences',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'workout_preference_id', referencedColumnName: 'id' },
  })
  workoutPreferences: WorkoutPreference[];

  @OneToMany(() => Match, (match) => match.userA)
  matchesAsUserA: Match[];

  @OneToMany(() => Match, (match) => match.userB)
  matchesAsUserB: Match[];

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

