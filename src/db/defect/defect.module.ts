import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DefectService } from './defect.service';
import { DefectController } from './defect.controller';
import { Defect } from './defect.entity';

@Module({
  imports: [SequelizeModule.forFeature([Defect])],
  providers: [DefectService],
  controllers: [DefectController],
  exports: [DefectService],
})
export class DefectModule {}
