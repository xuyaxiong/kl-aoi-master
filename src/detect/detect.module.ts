import { Module } from '@nestjs/common';
import { DetectController } from './detect.controller';
import { DetectService } from './detect.service';
import { PlcModule } from 'src/plc/plc.module';

@Module({
  imports: [PlcModule],
  controllers: [DetectController],
  providers: [DetectService],
})
export class DetectModule {}
