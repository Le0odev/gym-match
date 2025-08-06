import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DiscoverUsersDto, LikeUserDto, SkipUserDto, MatchFiltersDto } from '../dto/match.dto';

@Controller('matches')
@UseGuards(JwtAuthGuard)
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get('discover')
  async discoverUsers(@Request() req, @Query() filters: DiscoverUsersDto) {
    return this.matchesService.discoverUsers(req.user.id, filters);
  }

  @Post('discover/advanced')
  async discoverUsersAdvanced(@Request() req, @Body() filters: DiscoverUsersDto) {
    return this.matchesService.discoverUsers(req.user.id, filters);
  }

  @Get('nearby')
  async getNearbyUsers(@Request() req, @Query('distance') distance: number = 5) {
    return this.matchesService.getNearbyUsers(req.user.id, distance);
  }

  @Get('suggestions')
  async getSuggestions(@Request() req, @Query('limit') limit: number = 10) {
    return this.matchesService.getSuggestions(req.user.id, limit);
  }

  @Post('like/:userId')
  async likeUser(@Request() req, @Param('userId') userId: string, @Body() likeData?: LikeUserDto) {
    return this.matchesService.likeUser(req.user.id, userId, likeData?.message);
  }

  @Post('skip/:userId')
  async skipUser(@Request() req, @Param('userId') userId: string, @Body() skipData?: SkipUserDto) {
    return this.matchesService.skipUser(req.user.id, userId, skipData?.reason);
  }

  @Post('super-like/:userId')
  async superLikeUser(@Request() req, @Param('userId') userId: string, @Body() likeData?: LikeUserDto) {
    return this.matchesService.superLikeUser(req.user.id, userId, likeData?.message);
  }

  @Get()
  async getUserMatches(@Request() req, @Query() filters: MatchFiltersDto) {
    return this.matchesService.getUserMatches(req.user.id, filters);
  }

  @Get('stats')
  async getMatchStats(@Request() req) {
    return this.matchesService.getMatchStats(req.user.id);
  }

  @Get('compatibility/:userId')
  async getCompatibilityScore(@Request() req, @Param('userId') userId: string) {
    return this.matchesService.getCompatibilityScore(req.user.id, userId);
  }

  @Post('unmatch/:matchId')
  async unmatch(@Request() req, @Param('matchId') matchId: string) {
    return this.matchesService.unmatch(req.user.id, matchId);
  }

  @Get('filters/saved')
  async getSavedFilters(@Request() req) {
    return this.matchesService.getSavedFilters(req.user.id);
  }

  @Post('filters/save')
  async saveFilters(@Request() req, @Body() filters: DiscoverUsersDto) {
    return this.matchesService.saveFilters(req.user.id, filters);
  }
}

