import { Controller, Get, Put, Post, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UpdateUserDto, UpdateLocationDto, AddWorkoutPreferencesDto } from '../dto/user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  @Put('me')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.id, updateUserDto);
  }

  @Put('me/location')
  async updateLocation(@Request() req, @Body() updateLocationDto: UpdateLocationDto) {
    return this.usersService.updateLocation(req.user.id, updateLocationDto);
  }

  @Post('me/workout-preferences')
  async addWorkoutPreferences(
    @Request() req,
    @Body() addWorkoutPreferencesDto: AddWorkoutPreferencesDto,
  ) {
    return this.usersService.addWorkoutPreferences(req.user.id, addWorkoutPreferencesDto);
  }

  @Get('me/workout-preferences')
  async getWorkoutPreferences(@Request() req) {
    return this.usersService.getWorkoutPreferences(req.user.id);
  }
}

