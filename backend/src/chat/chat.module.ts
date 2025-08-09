import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Message, Match, WorkoutInvite, User, Gym } from '../entities';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message, Match, WorkoutInvite, User, Gym]),
    NotificationsModule,
    GatewayModule,
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

