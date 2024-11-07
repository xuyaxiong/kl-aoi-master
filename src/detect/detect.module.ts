import { Module } from '@nestjs/common';
import { DetectController } from './detect.controller';
import { DetectService } from './detect.service';
import { PlcModule } from 'src/plc/plc.module';
import { CameraModule } from 'src/camera/camera.module';
import { RecipeModule } from 'src/db/recipe/recipe.module';

@Module({
  imports: [PlcModule, CameraModule, RecipeModule],
  controllers: [DetectController],
  providers: [DetectService],
})
export class DetectModule {}
