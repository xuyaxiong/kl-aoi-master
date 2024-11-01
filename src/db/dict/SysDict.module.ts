import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { SysDictService } from './SysDict.service';
import { SysDictController } from './SysDict.controller';
import { SysDictType } from './SysDictType.entity';
import { SysDictItem } from './SysDictItem.entity';

@Module({
  imports: [SequelizeModule.forFeature([SysDictType, SysDictItem])],
  providers: [SysDictService],
  controllers: [SysDictController],
  exports: [SysDictService],
})
export class SysDictModule {}
