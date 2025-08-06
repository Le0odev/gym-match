import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum DeviceType {
  IOS = 'ios',
  ANDROID = 'android',
  WEB = 'web',
}

@Entity('push_tokens')
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  user: User;

  @Column({ unique: true })
  token: string;

  @Column({
    type: 'enum',
    enum: DeviceType,
  })
  deviceType: DeviceType;

  @Column({ name: 'device_id', nullable: true })
  deviceId: string;

  @Column({ name: 'app_version', nullable: true })
  appVersion: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_used', type: 'timestamp', nullable: true })
  lastUsed: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

