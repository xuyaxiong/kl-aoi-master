import {
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { publishData, subscribeData } from './ws.bo';

@WebSocketGateway(9000, {
  transports: ['websocket', 'polling', 'jsonp-polling'],
  cors: {
    origin: '*',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
})
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket, ...args: any[]): void {
    console.log(`Client ${client.id} connected`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client ${client.id} disconnected`);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: subscribeData): void {
    console.log(`Client ${client.id} subscribed to ${JSON.stringify(data)}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: subscribeData): void {
    console.log(`Client ${client.id} unsubscribed from ${data.channel}`);
  }

  public publish(event: string, data: publishData): void {
    this.server.emit(event, data);
  }

  public to(channel: string, event: string, data: publishData): void {
    this.server.to(channel).emit(event, data);
  }
}
