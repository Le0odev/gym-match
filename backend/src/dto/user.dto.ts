import { IsString, IsOptional, IsNumber, IsArray, IsUUID, IsLatitude, IsLongitude, IsDateString, IsEnum } from 'class-validator';

export enum ExperienceLevel {
  BEGINNER = 'Iniciante',
  INTERMEDIATE = 'Intermediário',
  ADVANCED = 'Avançado',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  goal?: string;

  @IsOptional()
  @IsString()
  availableTime?: string;

  @IsOptional()
  @IsUUID()
  gymId?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateLocationDto {
  @IsLatitude()
  latitude: number;

  @IsLongitude()
  longitude: number;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;
}

export class AddWorkoutPreferencesDto {
  @IsArray()
  @IsUUID('4', { each: true })
  workoutPreferenceIds: string[];
}

export class UploadPhotoDto {
  @IsString()
  photoUrl: string;
}

export class UpdateProfileSettingsDto {
  @IsOptional()
  @IsString()
  notifications?: boolean;

  @IsOptional()
  @IsString()
  darkMode?: boolean;

  @IsOptional()
  @IsString()
  showOnline?: boolean;
}

