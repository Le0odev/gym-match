import { Controller, Get } from '@nestjs/common';
import { WorkoutPreferencesService } from './workout-preferences.service';

@Controller('workout-preferences')
export class WorkoutPreferencesController {
  constructor(private workoutPreferencesService: WorkoutPreferencesService) {}

  @Get()
  async findAll() {
    return this.workoutPreferencesService.findAll();
  }
}

