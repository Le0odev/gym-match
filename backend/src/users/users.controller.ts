import { 
  Controller, 
  Get, 
  Put, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  UpdateUserDto, 
  UpdateLocationDto, 
  AddWorkoutPreferencesDto, 
  UploadPhotoDto,
  UpdateProfileSettingsDto 
} from '../dto/user.dto';

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

  @Put('me/workout-preferences')
  async updateWorkoutPreferences(
    @Request() req,
    @Body() updateWorkoutPreferencesDto: { workoutPreferenceIds: number[] },
  ) {
    return this.usersService.updateWorkoutPreferences(req.user.id, updateWorkoutPreferencesDto.workoutPreferenceIds);
  }

  @Get('me/workout-preferences')
  async getWorkoutPreferences(@Request() req) {
    return this.usersService.getWorkoutPreferences(req.user.id);
  }

  // Novas funcionalidades para o app mobile
  @Post('me/upload-photo')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(@Request() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.usersService.uploadProfilePhoto(req.user.id, file);
  }

  @Put('me/photo')
  async updatePhotoUrl(@Request() req, @Body() uploadPhotoDto: UploadPhotoDto) {
    return this.usersService.updateProfilePhotoUrl(req.user.id, uploadPhotoDto.photoUrl);
  }

  @Put('me/settings')
  async updateSettings(@Request() req, @Body() updateSettingsDto: UpdateProfileSettingsDto) {
    return this.usersService.updateProfileSettings(req.user.id, updateSettingsDto);
  }

  @Get('me/stats')
  async getStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  @Post('me/increment-views')
  async incrementProfileViews(@Request() req) {
    return this.usersService.incrementProfileViews(req.user.id);
  }

  @Post('me/increment-workouts')
  async incrementCompletedWorkouts(@Request() req) {
    return this.usersService.incrementCompletedWorkouts(req.user.id);
  }

  @Put('me/last-seen')
  async updateLastSeen(@Request() req) {
    return this.usersService.updateLastSeen(req.user.id);
  }
}

