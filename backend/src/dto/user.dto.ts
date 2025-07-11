import { IsString, IsOptional, IsNumber, IsArray, IsUUID, IsLatitude, IsLongitude } from 'class-validator';

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

