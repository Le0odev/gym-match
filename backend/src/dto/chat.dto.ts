import { IsString, IsOptional, IsEnum, IsUUID, IsObject, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { MessageType } from '../entities/message.entity';

export class SendMessageDto {
  @IsUUID()
  matchId: string;

  @IsEnum(MessageType)
  type: MessageType = MessageType.TEXT;

  @IsString()
  content: string;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsUUID()
  replyToId?: string;
}

export class EditMessageDto {
  @IsString()
  content: string;
}

export class MessageFiltersDto {
  @IsOptional()
  @IsEnum(MessageType)
  type?: MessageType;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 50;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;

  @IsOptional()
  @IsString()
  before?: string; // Message ID para paginação
}

export class TypingIndicatorDto {
  @IsUUID()
  matchId: string;

  @IsOptional()
  @IsString()
  isTyping?: boolean = true;
}

export class WorkoutInviteDto {
  @IsUUID()
  matchId: string;

  @IsString()
  workoutType: string;

  @IsString()
  date: string; // ISO date string

  @IsString()
  time: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  message?: string;
}

export class LocationShareDto {
  @IsUUID()
  matchId: string;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  placeName?: string;
}

