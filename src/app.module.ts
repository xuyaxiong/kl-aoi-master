import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import localConfig from './config/local.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { WsModule } from './ws/ws.module';
import { DetectModule } from './detect/detect.module';
import { PlcModule } from './plc/plc.module';
import { CameraModule } from './camera/camera.module';
import AppConfig from './app.config';
import { ProxyMiddleware } from './middleware/proxy.middle';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [localConfig],
    }),
    EventEmitterModule.forRoot(),
    WsModule,
    DatabaseModule,
    PlcModule,
    CameraModule,
    DetectModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ProxyMiddleware)
      .forRoutes({ path: 'aoiDB/*', method: RequestMethod.ALL });
  }
}
