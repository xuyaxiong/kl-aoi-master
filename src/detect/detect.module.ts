import { Module } from '@nestjs/common';
import { DetectController } from './detect.controller';
import { DetectService } from './detect.service';

@Module({
  imports: [],
  controllers: [DetectController],
  providers: [DetectService],
})
export class DetectModule {}
