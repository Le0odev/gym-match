import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('matches')
export class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_a_id' })
  userAId: string;

  @Column({ name: 'user_b_id' })
  userBId: string;

  @ManyToOne(() => User, (user) => user.matchesAsUserA)
  @JoinColumn({ name: 'user_a_id' })
  userA: User;

  @ManyToOne(() => User, (user) => user.matchesAsUserB)
  @JoinColumn({ name: 'user_b_id' })
  userB: User;

  @Column({
    type: 'enum',
    enum: MatchStatus,
    default: MatchStatus.PENDING,
  })
  status: MatchStatus;

  @Column('decimal', { precision: 5, scale: 2, nullable: true, name: 'compatibility_score' })
  compatibilityScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

