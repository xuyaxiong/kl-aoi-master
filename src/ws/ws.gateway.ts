import {
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PublishData, SubscribeData } from './ws.bo';
import { Logger } from '@nestjs/common';

interface ServiceInfo {
  event: string;
  serviceName: string;
}

enum ServiceStatus {
  ONLINE = 0,
  OFFLINE = 1,
}

@WebSocketGateway(9000, {
  transports: ['websocket', 'polling', 'jsonp-polling'],
  cors: {
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WsGateway.name);
  @WebSocketServer() server: Server;
  private connectedServices = new Map<string, ServiceInfo>();
  private customerClient = '';

  handleConnection(client: Socket, ...args: any[]): void {
    const { clientType } = client.handshake.query;
    if (clientType !== 'service') {
      this.customerClient = client.id;
    }
  }

  handleDisconnect(client: Socket): void {
    if (this.connectedServices.has(client.id)) {
      const { event, serviceName } = this.connectedServices.get(client.id);
      this.logger.error(`${serviceName}离线`);
      this.server.to(this.customerClient).emit('ServiceState', [
        {
          event,
          name: serviceName,
          state: ServiceStatus.OFFLINE,
        },
      ]);
    }
    this.connectedServices.delete(client.id);
  }

  @SubscribeMessage('healthCheck')
  handleJoinRoom(
    client: Socket,
    payload: { event: string; serviceName: string },
  ) {
    const { event, serviceName } = payload;
    this.connectedServices.set(client.id, { event, serviceName });
    this.logger.log(`${serviceName}上线`);
    this.server.to(this.customerClient).emit('ServiceState', [
      {
        event,
        name: serviceName,
        state: ServiceStatus.ONLINE,
      },
    ]);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: SubscribeData): void {
    console.log(`Client ${client.id} subscribed to ${JSON.stringify(data)}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: SubscribeData): void {
    console.log(`Client ${client.id} unsubscribed from ${data.channel}`);
  }

  public publishToWebClient(
    event: string,
    data: PublishData | PublishData[],
  ): void {
    if (!this.customerClient) return;
    this.server.to(this.customerClient).emit(event, data);
  }
}
