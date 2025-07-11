import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkoutPreferencesService } from './workout-preferences.service';
import { WorkoutPreferencesController } from './workout-preferences.controller';
import { WorkoutPreference } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([WorkoutPreference])],
  controllers: [WorkoutPreferencesController],
  providers: [WorkoutPreferencesService],
  exports: [WorkoutPreferencesService],
})
export class WorkoutPreferencesModule {}

