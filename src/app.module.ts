import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import localConfig from './config/local.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CameraController } from './camera/camera.controller';
import { CameraService } from './camera/camera.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [localConfig] }),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AppController, CameraController],
  providers: [AppService, CameraService],
})
export class AppModule {}
