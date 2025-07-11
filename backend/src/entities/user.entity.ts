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

