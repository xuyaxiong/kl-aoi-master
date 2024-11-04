import { Module } from '@nestjs/common';
import { PatternService } from './pattern.service';
import { PatternController } from './pattern.controller';
import { Pattern } from './pattern.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Pattern])],
  providers: [PatternService],
  controllers: [PatternController],
  exports: [PatternService],
})
export class PatternModule {}
