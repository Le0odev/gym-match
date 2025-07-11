import { Injectable, OnModuleInit } from '@nestjs/common';
import { WorkoutPreferencesService } from './workout-preferences/workout-preferences.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private workoutPreferencesService: WorkoutPreferencesService) {}

  async onModuleInit() {
    await this.seedWorkoutPreferences();
  }

  private async seedWorkoutPreferences() {
    await this.workoutPreferencesService.seedWorkoutPreferences();
    console.log('Workout preferences seeded successfully');
  }
}

