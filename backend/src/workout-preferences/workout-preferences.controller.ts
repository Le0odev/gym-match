import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { WorkoutPreferencesService } from './workout-preferences.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWorkoutPreferenceDto, UpdateWorkoutPreferenceDto } from '../dto/workout-preference.dto';

@Controller('workout-preferences')
export class WorkoutPreferencesController {
  constructor(private workoutPreferencesService: WorkoutPreferencesService) {}

  @Get()
  async findAll(@Query('category') category?: string, @Query('search') search?: string) {
    return this.workoutPreferencesService.findAll(category, search);
  }

  @Get('categories')
  async getCategories() {
    return this.workoutPreferencesService.getCategories();
  }

  @Get('popular')
  async getPopular(@Query('limit') limit?: number) {
    return this.workoutPreferencesService.getPopular(limit);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.workoutPreferencesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createWorkoutPreferenceDto: CreateWorkoutPreferenceDto) {
    return this.workoutPreferencesService.create(createWorkoutPreferenceDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateWorkoutPreferenceDto: UpdateWorkoutPreferenceDto,
  ) {
    return this.workoutPreferencesService.update(id, updateWorkoutPreferenceDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.workoutPreferencesService.remove(id);
  }

  @Get(':id/users-count')
  async getUsersCount(@Param('id') id: string) {
    return this.workoutPreferencesService.getUsersCount(id);
  }
}

