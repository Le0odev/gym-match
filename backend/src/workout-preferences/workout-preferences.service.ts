import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { WorkoutPreference, WorkoutCategory } from '../entities';
import { CreateWorkoutPreferenceDto, UpdateWorkoutPreferenceDto } from '../dto/workout-preference.dto';

@Injectable()
export class WorkoutPreferencesService {
  constructor(
    @InjectRepository(WorkoutPreference)
    private workoutPreferenceRepository: Repository<WorkoutPreference>,
  ) {}

  async findAll(category?: string, search?: string): Promise<WorkoutPreference[]> {
    const queryBuilder = this.workoutPreferenceRepository.createQueryBuilder('wp');

    if (category) {
      queryBuilder.andWhere('wp.category = :category', { category });
    }

    if (search) {
      queryBuilder.andWhere('wp.name ILIKE :search', { search: `%${search}%` });
    }

    queryBuilder.orderBy('wp.usersCount', 'DESC');

    return queryBuilder.getMany();
  }

  async findOne(id: string): Promise<WorkoutPreference> {
    const workoutPreference = await this.workoutPreferenceRepository.findOne({
      where: { id },
      relations: ['users'],
    });

    if (!workoutPreference) {
      throw new NotFoundException('Workout preference not found');
    }

    return workoutPreference;
  }

  async create(createWorkoutPreferenceDto: CreateWorkoutPreferenceDto): Promise<WorkoutPreference> {
    const workoutPreference = this.workoutPreferenceRepository.create(createWorkoutPreferenceDto);
    return this.workoutPreferenceRepository.save(workoutPreference);
  }

  async update(id: string, updateWorkoutPreferenceDto: UpdateWorkoutPreferenceDto): Promise<WorkoutPreference> {
    const workoutPreference = await this.findOne(id);
    Object.assign(workoutPreference, updateWorkoutPreferenceDto);
    return this.workoutPreferenceRepository.save(workoutPreference);
  }

  async remove(id: string): Promise<void> {
    const workoutPreference = await this.findOne(id);
    await this.workoutPreferenceRepository.remove(workoutPreference);
  }

  async getCategories(): Promise<{ category: WorkoutCategory; count: number }[]> {
    const result = await this.workoutPreferenceRepository
      .createQueryBuilder('wp')
      .select('wp.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .where('wp.category IS NOT NULL')
      .groupBy('wp.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return result.map(item => ({
      category: item.category,
      count: parseInt(item.count),
    }));
  }

  async getPopular(limit: number = 10): Promise<WorkoutPreference[]> {
    return this.workoutPreferenceRepository.find({
      where: { isPopular: true },
      order: { usersCount: 'DESC' },
      take: limit,
    });
  }

  async getUsersCount(id: string): Promise<{ count: number }> {
    const workoutPreference = await this.workoutPreferenceRepository
      .createQueryBuilder('wp')
      .leftJoin('wp.users', 'user')
      .select('COUNT(user.id)', 'count')
      .where('wp.id = :id', { id })
      .getRawOne();

    return { count: parseInt(workoutPreference.count) || 0 };
  }

  async updateUsersCount(id: string): Promise<void> {
    const { count } = await this.getUsersCount(id);
    await this.workoutPreferenceRepository.update(id, { 
      usersCount: count,
      isPopular: count > 50, // Marca como popular se tiver mais de 50 usuários
    });
  }

  async seedWorkoutPreferences(): Promise<void> {
    const workoutTypes = [
      { name: 'Musculação', category: WorkoutCategory.STRENGTH, description: 'Treinamento com pesos para ganho de massa muscular', icon: 'fitness' },
      { name: 'Cardio', category: WorkoutCategory.CARDIO, description: 'Exercícios cardiovasculares para resistência', icon: 'heart' },
      { name: 'Yoga', category: WorkoutCategory.FLEXIBILITY, description: 'Prática milenar para flexibilidade e bem-estar', icon: 'leaf' },
      { name: 'Pilates', category: WorkoutCategory.FLEXIBILITY, description: 'Fortalecimento do core e flexibilidade', icon: 'body' },
      { name: 'CrossFit', category: WorkoutCategory.FUNCTIONAL, description: 'Treinamento funcional de alta intensidade', icon: 'barbell' },
      { name: 'Funcional', category: WorkoutCategory.FUNCTIONAL, description: 'Exercícios que simulam movimentos do dia a dia', icon: 'accessibility' },
      { name: 'Natação', category: WorkoutCategory.CARDIO, description: 'Esporte aquático completo', icon: 'water' },
      { name: 'Corrida', category: WorkoutCategory.CARDIO, description: 'Exercício cardiovascular ao ar livre ou esteira', icon: 'walk' },
      { name: 'Ciclismo', category: WorkoutCategory.CARDIO, description: 'Pedalada para resistência e fortalecimento das pernas', icon: 'bicycle' },
      { name: 'Boxe', category: WorkoutCategory.SPORTS, description: 'Arte marcial para condicionamento físico', icon: 'fitness' },
      { name: 'Dança', category: WorkoutCategory.WELLNESS, description: 'Atividade física divertida e expressiva', icon: 'musical-notes' },
      { name: 'Caminhada', category: WorkoutCategory.WELLNESS, description: 'Exercício leve e acessível para todos', icon: 'walk' },
    ];

    for (const workoutData of workoutTypes) {
      const existing = await this.workoutPreferenceRepository.findOne({ 
        where: { name: workoutData.name } 
      });
      
      if (!existing) {
        const workoutPreference = this.workoutPreferenceRepository.create(workoutData);
        await this.workoutPreferenceRepository.save(workoutPreference);
      } else {
        // Atualizar dados existentes se necessário
        Object.assign(existing, workoutData);
        await this.workoutPreferenceRepository.save(existing);
      }
    }
  }
}

