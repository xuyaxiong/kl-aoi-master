import { IoAdapter } from '@nestjs/platform-socket.io';
import * as socketio from 'socket.io';

export class WsAdapter extends IoAdapter {
  createIOServer(
    port: number,
    options?: socketio.ServerOptions,
  ): socketio.Server {
    const server = super.createIOServer(port, options);
    return server;
  }

  bindClientConnect(server: socketio.Server, callback: Function): void {
    server.on('connection', (socket) => {
      callback(socket);
    });
  }

  bindClientDisconnect(client: socketio.Socket, callback: Function): void {
    client.on('disconnect', () => {
      callback();
    });
  }
}
