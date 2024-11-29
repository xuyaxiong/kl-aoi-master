import { Module } from '@nestjs/common';
import { MaterialService } from './material.service';
import { MaterialController } from './material.controller';
import { Material } from './material.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pattern } from '../pattern/pattern.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Material]),
    TypeOrmModule.forFeature([Pattern]),
  ],
  providers: [MaterialService],
  controllers: [MaterialController],
  exports: [MaterialService],
})
export class MaterialModule {}
