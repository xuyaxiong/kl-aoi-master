import { Module } from '@nestjs/common';
import { CameraController } from './camera.controller';
import { CameraService } from './camera.service';
import { SysDictModule } from 'src/db/dict/SysDict.module';

@Module({
  imports: [SysDictModule],
  controllers: [CameraController],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
