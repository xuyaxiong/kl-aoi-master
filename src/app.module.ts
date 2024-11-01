import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import localConfig from './config/local.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CameraController } from './camera/camera.controller';
import { CameraService } from './camera/camera.service';
import { PlcCtroller } from './plc/plc.controller';
import { PlcService } from './plc/plc.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [localConfig] }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController, CameraController, PlcCtroller],
  providers: [AppService, CameraService, PlcService],
})
export class AppModule {}
