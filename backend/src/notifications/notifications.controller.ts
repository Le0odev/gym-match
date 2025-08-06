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
  Request 
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { 
  RegisterPushTokenDto, 
  SendNotificationDto, 
  BulkNotificationDto, 
  NotificationFiltersDto,
  UpdateNotificationDto 
} from '../dto/notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('register-token')
  async registerPushToken(@Request() req, @Body() registerDto: RegisterPushTokenDto) {
    return this.notificationsService.registerPushToken(req.user.id, registerDto);
  }

  @Get()
  async getUserNotifications(@Request() req, @Query() filters: NotificationFiltersDto) {
    return this.notificationsService.getUserNotifications(req.user.id, filters);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Put(':id/read')
  async markAsRead(@Request() req, @Param('id') notificationId: string) {
    return this.notificationsService.markAsRead(req.user.id, notificationId);
  }

  @Put('mark-all-read')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { status: 'ok' };
  }

  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') notificationId: string) {
    await this.notificationsService.deleteNotification(req.user.id, notificationId);
    return { status: 'ok' };
  }

  @Get('settings')
  async getNotificationSettings(@Request() req) {
    return this.notificationsService.getNotificationSettings(req.user.id);
  }

  @Put('settings')
  async updateNotificationSettings(@Request() req, @Body() settings: any) {
    await this.notificationsService.updateNotificationSettings(req.user.id, settings);
    return { status: 'ok' };
  }

  // Endpoints administrativos (requerem permissões especiais)
  @Post('send')
  async sendNotification(@Body() sendDto: SendNotificationDto) {
    return this.notificationsService.sendNotification(sendDto);
  }

  @Post('send-bulk')
  async sendBulkNotification(@Body() bulkDto: BulkNotificationDto) {
    return this.notificationsService.sendBulkNotification(bulkDto);
  }

  // Endpoints de conveniência para tipos específicos
  @Post('test-push')
  async testPushNotification(@Request() req) {
    return this.notificationsService.sendNotification({
      userId: req.user.id,
      type: 'system' as any,
      title: 'Notificação de Teste',
      message: 'Esta é uma notificação de teste para verificar se tudo está funcionando!',
      sendPush: true,
    });
  }
}

