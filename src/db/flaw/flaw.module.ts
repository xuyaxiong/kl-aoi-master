import { Module } from '@nestjs/common';
import { FlawService } from './flaw.service';
import { FlawController } from './flaw.controller';
import { Flaw } from './flaw.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Flaw])],
  providers: [FlawService],
  controllers: [FlawController],
  exports: [FlawService],
})
export class FlawModule {}
