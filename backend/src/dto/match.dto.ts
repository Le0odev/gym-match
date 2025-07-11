import { IsOptional, IsNumber, IsString, IsUUID, Min, Max } from 'class-validator';

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
}

