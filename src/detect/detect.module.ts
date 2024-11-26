import { Module } from '@nestjs/common';
import { DetectController } from './detect.controller';
import { DetectService } from './detect.service';
import { PlcModule } from '../plc/plc.module';
import { CameraModule } from '../camera/camera.module';
import { RecipeModule } from '../db/recipe/recipe.module';
import { FlawModule } from '../db/flaw/flaw.module';
import { MaterialModule } from '../db/material/material.module';
import { SysDictModule } from '../db/dict/SysDict.module';

@Module({
  imports: [
    PlcModule,
    CameraModule,
    MaterialModule,
    RecipeModule,
    FlawModule,
    SysDictModule,
  ],
  controllers: [DetectController],
  providers: [DetectService],
})
export class DetectModule {}
