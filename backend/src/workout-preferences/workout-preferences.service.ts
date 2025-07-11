import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkoutPreference } from '../entities';

@Injectable()
export class WorkoutPreferencesService {
  constructor(
    @InjectRepository(WorkoutPreference)
    private workoutPreferenceRepository: Repository<WorkoutPreference>,
  ) {}

  async findAll(): Promise<WorkoutPreference[]> {
    return this.workoutPreferenceRepository.find();
  }

  async seedWorkoutPreferences(): Promise<void> {
    const workoutTypes = [
      'Perna',
      'Peito',
      'Costas',
      'Ombro',
      'Braço',
      'Abdômen',
      'Cardio',
      'Funcional',
      'Crossfit',
      'Yoga',
      'Pilates',
      'Natação',
    ];

    for (const name of workoutTypes) {
      const existing = await this.workoutPreferenceRepository.findOne({ where: { name } });
      if (!existing) {
        const workoutPreference = this.workoutPreferenceRepository.create({ name });
        await this.workoutPreferenceRepository.save(workoutPreference);
      }
    }
  }
}

