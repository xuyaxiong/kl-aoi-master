import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { PatternService } from './pattern.service';
import { PatternController } from './pattern.controller';
import { Pattern } from './pattern.entity';

@Module({
  imports: [SequelizeModule.forFeature([Pattern])],
  providers: [PatternService],
  controllers: [PatternController],
  exports: [PatternService],
})
export class PatternModule {}
