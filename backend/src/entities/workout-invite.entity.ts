import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Match } from './match.entity';
import { User } from './user.entity';

export enum WorkoutInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELED = 'canceled',
}

export enum WorkoutTypeEnum {
  MUSCULATION = 'musculacao',
  CARDIO = 'cardio',
  FUNCTIONAL = 'funcional',
  HIIT = 'hit',
  CROSS = 'cross',
  OTHER = 'outro',
}

@Entity('workout_invites')
export class WorkoutInvite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'match_id' })
  matchId: string;

  @ManyToOne(() => Match)
  match: Match;

  @Column({ name: 'inviter_id' })
  inviterId: string;

  @ManyToOne(() => User)
  inviter: User;

  @Column({ name: 'invitee_id' })
  inviteeId: string;

  @ManyToOne(() => User)
  invitee: User;

  @Column({ type: 'enum', enum: WorkoutTypeEnum })
  workoutType: WorkoutTypeEnum;

  @Column({ type: 'date' })
  date: string; // YYYY-MM-DD (UTC)

  @Column({ type: 'varchar', length: 5 })
  time: string; // HH:mm (UTC)

  // Local
  @Column({ name: 'gym_id', nullable: true })
  gymId?: string;

  @Column({ name: 'address', type: 'text', nullable: true })
  address?: string;

  @Column({ name: 'latitude', type: 'double precision', nullable: true })
  latitude?: number;

  @Column({ name: 'longitude', type: 'double precision', nullable: true })
  longitude?: number;

  @Column({
    type: 'enum',
    enum: WorkoutInviteStatus,
    default: WorkoutInviteStatus.PENDING,
  })
  status: WorkoutInviteStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


