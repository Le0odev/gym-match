import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, Min, Max } from 'class-validator';
import { NotificationType, DeviceType } from '../entities/notification.entity';

export class RegisterPushTokenDto {
  @IsString()
  token: string;

  @IsEnum(DeviceType)
  deviceType: DeviceType;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class SendNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsBoolean()
  sendPush?: boolean = true;
}

export class BulkNotificationDto {
  @IsString({ each: true })
  userIds: string[];

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsBoolean()
  sendPush?: boolean = true;
}

export class NotificationFiltersDto {
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

export class UpdateNotificationDto {
  @IsOptional()
  @IsBoolean()
  read?: boolean;

  @IsOptional()
  @IsBoolean()
  dismissed?: boolean;
}

