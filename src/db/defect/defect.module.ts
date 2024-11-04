import { Module } from '@nestjs/common';
import { DefectService } from './defect.service';
import { DefectController } from './defect.controller';
import { Defect } from './defect.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Defect])],
  providers: [DefectService],
  controllers: [DefectController],
  exports: [DefectService],
})
export class DefectModule {}
