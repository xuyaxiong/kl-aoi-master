import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { FlawService } from './flaw.service';
import { FlawController } from './flaw.controller';
import { Flaw } from './flaw.entity';

@Module({
  imports: [SequelizeModule.forFeature([Flaw])],
  providers: [FlawService],
  controllers: [FlawController],
  exports: [FlawService],
})
export class FlawModule {}
