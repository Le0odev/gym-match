import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum MatchStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  UNMATCHED = 'unmatched',
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

  // Campos relacionados ao chat
  @Column({ name: 'last_message_at', type: 'timestamptz', nullable: true })
  lastMessageAt: Date;

  @Column({ name: 'last_message_preview', type: 'text', nullable: true })
  lastMessagePreview: string;

  @Column({ name: 'unread_count_a', default: 0 })
  unreadCountA: number; // Mensagens não lidas para userA

  @Column({ name: 'unread_count_b', default: 0 })
  unreadCountB: number; // Mensagens não lidas para userB

  @Column({ name: 'is_super_like', default: false })
  isSuperLike: boolean;

  @Column({ name: 'initial_message', type: 'text', nullable: true })
  initialMessage: string;

  @Column({ name: 'skip_reason', nullable: true })
  skipReason: string;

  // Campos para unmatch
  @Column({ name: 'unmatched_at', type: 'timestamptz', nullable: true })
  unmatchedAt: Date;

  @Column({ name: 'unmatched_by', nullable: true })
  unmatchedBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}

