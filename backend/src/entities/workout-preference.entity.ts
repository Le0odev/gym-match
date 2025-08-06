import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum WorkoutCategory {
  STRENGTH = 'Força',
  CARDIO = 'Cardio',
  FLEXIBILITY = 'Flexibilidade',
  FUNCTIONAL = 'Funcional',
  SPORTS = 'Esportes',
  WELLNESS = 'Bem-estar',
}

@Entity('workout_preferences')
export class WorkoutPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WorkoutCategory,
    nullable: true,
  })
  category: WorkoutCategory;

  @Column({ nullable: true })
  icon: string;

  @Column({ name: 'users_count', default: 0 })
  usersCount: number;

  @Column({ name: 'is_popular', default: false })
  isPopular: boolean;

  @ManyToMany(() => User, (user) => user.workoutPreferences)
  users: User[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

