import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class GatewayService {
  private io?: Server;

  setServer(io: Server) {
    this.io = io;
  }

  emitToUser(userId: string, event: string, payload: any) {
    if (!this.io) return;
    this.io.to(`user:${userId}`).emit(event, payload);
  }
}


