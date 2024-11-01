import { WsGateway } from './ws.gateway';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  exports: [WsGateway],
  providers: [WsGateway],
})
export class WsModule {}
