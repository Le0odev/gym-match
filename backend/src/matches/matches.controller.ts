import { Controller, Get, Post, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DiscoverUsersDto } from '../dto/match.dto';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get('discover')
  async discoverUsers(@Request() req, @Query() filters: DiscoverUsersDto) {
    return this.matchesService.discoverUsers(req.user.id, filters);
  }

  @Post('like/:userId')
  async likeUser(@Request() req, @Param('userId') userId: string) {
    return this.matchesService.likeUser(req.user.id, userId);
  }

  @Post('skip/:userId')
  async skipUser(@Request() req, @Param('userId') userId: string) {
    return this.matchesService.skipUser(req.user.id, userId);
  }

  @Get()
  async getUserMatches(@Request() req) {
    return this.matchesService.getUserMatches(req.user.id);
  }
}

