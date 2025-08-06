import { IsOptional, IsNumber, IsString, IsUUID, IsArray, IsEnum, IsBoolean, Min, Max } from 'class-validator';
import { ExperienceLevel, Gender } from '../entities/user.entity';

export class DiscoverUsersDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  distance?: number = 10; // km

  @IsOptional()
  @IsUUID()
  workoutType?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  workoutTypes?: string[]; // Múltiplas preferências

  @IsOptional()
  @IsNumber()
  minHeight?: number;

  @IsOptional()
  @IsNumber()
  maxHeight?: number;

  @IsOptional()
  @IsNumber()
  minWeight?: number;

  @IsOptional()
  @IsNumber()
  maxWeight?: number;

  @IsOptional()
  @IsString()
  availableTime?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  minAge?: number;

  @IsOptional()
  @IsNumber()
  @Min(18)
  @Max(100)
  maxAge?: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsOptional()
  @IsBoolean()
  onlineOnly?: boolean; // Apenas usuários online

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20; // Limite de resultados

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0; // Para paginação
}

export class LikeUserDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  message?: string; // Mensagem opcional no like
}

export class SkipUserDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsString()
  reason?: string; // Motivo do skip (opcional para analytics)
}

export class MatchFiltersDto {
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean; // Apenas matches com mensagens não lidas

  @IsOptional()
  @IsBoolean()
  recentOnly?: boolean; // Apenas matches recentes (últimos 7 dias)

  @IsOptional()
  @IsString()
  search?: string; // Buscar por nome

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number = 20;

  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}

