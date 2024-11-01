import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import localConfig from './config/local.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { DatabaseService } from './db/database.service';
import { CameraController } from './camera/camera.controller';
import { CameraService } from './camera/camera.service';
import { PlcCtroller } from './plc/plc.controller';
import { PlcService } from './plc/plc.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [localConfig] }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
  ],
  controllers: [AppController, CameraController, PlcCtroller],
  providers: [AppService, DatabaseService, CameraService, PlcService],
})
export class AppModule {}
