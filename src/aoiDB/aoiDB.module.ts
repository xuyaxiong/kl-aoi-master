import { Module } from '@nestjs/common';
import { AOIDBController } from './aoiDB.controller';
import { AOIDBService } from './aoiDB.service';

@Module({
  controllers: [AOIDBController],
  providers: [AOIDBService],
  exports: [AOIDBService],
})
export class AOIDBModule {}
