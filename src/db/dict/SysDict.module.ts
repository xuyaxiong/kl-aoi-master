import { Module } from '@nestjs/common';
import { SysDictService } from './SysDict.service';
import { SysDictController } from './SysDict.controller';
import { SysDictType } from './SysDictType.entity';
import { SysDictItem } from './SysDictItem.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([SysDictType, SysDictItem])],
  providers: [SysDictService],
  controllers: [SysDictController],
  exports: [SysDictService],
})
export class SysDictModule {}
