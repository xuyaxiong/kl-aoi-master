import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import localConfig from './config/local.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './db/database.module';
import { CameraController } from './camera/camera.controller';
import { CameraService } from './camera/camera.service';
import { PlcCtroller } from './plc/plc.controller';
import { PlcService } from './plc/plc.service';
import { WsModule } from './ws/ws.module';
import { PatternModule } from './db/pattern/pattern.module';
import { DefectModule } from './db/defect/defect.module';
import { RecipeModule } from './db/recipe/recipe.module';
import { UserModule } from './db/user/user.module';
import { MaterialModule } from './db/material/material.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [localConfig] }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    UserModule,
    PatternModule,
    DefectModule,
    RecipeModule,
    MaterialModule,
    WsModule,
  ],
  controllers: [AppController, CameraController, PlcCtroller],
  providers: [AppService, CameraService, PlcService],
})
export class AppModule {}
