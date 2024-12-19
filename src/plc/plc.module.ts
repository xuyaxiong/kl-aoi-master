import { Module } from '@nestjs/common';
import { PlcController } from './plc.controller';
import { PlcService } from './plc.service';
import { WsModule } from '../ws/ws.module';

@Module({
  imports: [WsModule],
  controllers: [PlcController],
  providers: [PlcService],
  exports: [PlcService],
})
export class PlcModule {}
