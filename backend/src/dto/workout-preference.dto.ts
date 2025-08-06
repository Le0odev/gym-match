import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum WorkoutCategory {
  STRENGTH = 'Força',
  CARDIO = 'Cardio',
  FLEXIBILITY = 'Flexibilidade',
  FUNCTIONAL = 'Funcional',
  SPORTS = 'Esportes',
  WELLNESS = 'Bem-estar',
}

export class CreateWorkoutPreferenceDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkoutCategory)
  category?: WorkoutCategory;

  @IsOptional()
  @IsString()
  icon?: string;
}

export class UpdateWorkoutPreferenceDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(WorkoutCategory)
  category?: WorkoutCategory;

  @IsOptional()
  @IsString()
  icon?: string;
}

