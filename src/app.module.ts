import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import localConfig from './config/local.config';
import bench1Config from './config/bench1.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { WsModule } from './ws/ws.module';
import { DetectModule } from './detect/detect.module';
import { PlcModule } from './plc/plc.module';
import { CameraModule } from './camera/camera.module';
import { AOIDBModule } from '@koala123/aoi-db';
import AppConfig from './app.config';
import { ProxyMiddleware } from './middleware/proxy.middle';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [
        process.env.platform.trim() === 'bench1' ? bench1Config : localConfig,
      ],
    }),
    EventEmitterModule.forRoot(),
    WsModule,
    DatabaseModule,
    PlcModule,
    CameraModule,
    // AOIDBModule.forRoot({
    //   width: AppConfig.imgInfo.width,
    //   height: AppConfig.imgInfo.height,
    //   channel: AppConfig.imgInfo.channel,
    //   dbPath: AppConfig.exportPath.dbPath,
    //   dllPath: AppConfig.DLL_PATH,
    // }),
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
