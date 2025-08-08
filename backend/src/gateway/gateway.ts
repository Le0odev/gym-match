import { OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, ConnectedSocket } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GatewayService } from './gateway.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  path: '/socket-io',
})
export class AppGateway implements OnModuleInit {
  @WebSocketServer()
  server: Server;

  constructor(private gatewayService: GatewayService) {}

  onModuleInit() {
    this.gatewayService.setServer(this.server);
    this.server.on('connection', (socket: Socket) => {
      // Espera receber userId para entrar na sala privada
      socket.on('register', (userId: string) => {
        if (userId) {
          socket.join(`user:${userId}`);
        }
      });
    });
  }

  // ping-pong opcional
  @SubscribeMessage('ping')
  ping(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    client.emit('pong', data);
  }
}


