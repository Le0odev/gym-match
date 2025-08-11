import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query, 
  UseGuards, 
  Request, 
  BadRequestException
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  SendMessageDto, 
  EditMessageDto, 
  MessageFiltersDto, 
  WorkoutInviteDto, 
  LocationShareDto 
} from '../dto/chat.dto';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('messages')
  async sendMessage(@Request() req, @Body() sendMessageDto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, sendMessageDto);
  }

  @Get('matches/:matchId/messages')
  async getMatchMessages(
    @Request() req, 
    @Param('matchId') matchId: string,
    @Query() filters: MessageFiltersDto
  ) {
    return this.chatService.getMatchMessages(req.user.id, matchId, filters);
  }

  @Get('matches/:matchId/invites')
  async getMatchInvites(@Request() req, @Param('matchId') matchId: string) {
    return this.chatService.getMatchInvites(req.user.id, matchId);
  }

  // Sugestões de academias próximas ao ponto médio do par
  @Get('matches/:matchId/gyms/nearby')
  async getNearbyGyms(@Request() req, @Param('matchId') matchId: string, @Query('radius') radius: string = '5000', @Query('limit') limit: string = '5') {
    const r = parseInt(radius, 10) || 5000;
    const l = parseInt(limit, 10) || 5;
    if (r <= 0 || l <= 0) throw new BadRequestException('Invalid radius or limit');
    return this.chatService.getNearbyGymsForMatch(req.user.id, matchId, r, l);
  }

  @Put('messages/:messageId/read')
  async markMessageAsRead(@Request() req, @Param('messageId') messageId: string) {
    return this.chatService.markMessageAsRead(req.user.id, messageId);
  }

  @Put('matches/:matchId/read-all')
  async markAllMessagesAsRead(@Request() req, @Param('matchId') matchId: string) {
    await this.chatService.markAllMessagesAsRead(req.user.id, matchId);
    return { status: 'ok' };
  }

  @Put('messages/:messageId')
  async editMessage(
    @Request() req, 
    @Param('messageId') messageId: string,
    @Body() editDto: EditMessageDto
  ) {
    return this.chatService.editMessage(req.user.id, messageId, editDto);
  }

  @Delete('messages/:messageId')
  async deleteMessage(@Request() req, @Param('messageId') messageId: string) {
    await this.chatService.deleteMessage(req.user.id, messageId);
    return { status: 'ok' };
  }

  @Post('workout-invite')
  async sendWorkoutInvite(@Request() req, @Body() inviteDto: WorkoutInviteDto) {
    return this.chatService.sendWorkoutInvite(req.user.id, inviteDto);
  }

  @Put('workout-invite/:id/accept')
  async acceptInvite(@Request() req, @Param('id') id: string) {
    return this.chatService.updateWorkoutInviteStatus(req.user.id, id, 'accepted');
  }

  @Put('workout-invite/:id/reject')
  async rejectInvite(@Request() req, @Param('id') id: string) {
    return this.chatService.updateWorkoutInviteStatus(req.user.id, id, 'rejected');
  }

  @Put('workout-invite/:id/cancel')
  async cancelInvite(@Request() req, @Param('id') id: string) {
    return this.chatService.updateWorkoutInviteStatus(req.user.id, id, 'canceled');
  }

  @Put('workout-invite/:id/complete')
  async completeInvite(@Request() req, @Param('id') id: string) {
    return this.chatService.completeWorkoutInvite(req.user.id, id);
  }

  @Post('share-location')
  async shareLocation(@Request() req, @Body() locationDto: LocationShareDto) {
    return this.chatService.shareLocation(req.user.id, locationDto);
  }

  @Get('unread-count')
  async getUnreadMessagesCount(@Request() req) {
    return this.chatService.getUnreadMessagesCount(req.user.id);
  }

  @Get('matches/:matchId/unread-count')
  async getMatchUnreadCount(@Request() req, @Param('matchId') matchId: string) {
    return this.chatService.getMatchUnreadCount(req.user.id, matchId);
  }

  @Get('search')
  async searchMessages(
    @Request() req, 
    @Query('q') query: string,
    @Query('limit') limit: number = 20
  ) {
    return this.chatService.searchMessages(req.user.id, query, limit);
  }
}

