import { IsString, IsOptional, IsEnum, IsUUID, IsArray, IsBoolean, IsNumber, Min, Max, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationType } from '../entities/notification.entity';
import { DeviceType } from '../entities/push-token.entity';

export class RegisterPushTokenDto {
  @IsString()
  token: string;

  @IsOptional()
  @IsString()
  platform?: string; // ios | android | web

  // Campos usados no service
  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsEnum(DeviceType)
  deviceType?: DeviceType;

  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class SendNotificationDto {
  @IsUUID()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  title?: string;

  // Extras usados pelo service
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  sendPush?: boolean;
}

export class BulkNotificationDto {
  @IsArray()
  @IsUUID('4', { each: true })
  userIds: string[];

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsBoolean()
  sendPush?: boolean = true;

  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}

export class NotificationFiltersDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean
}

