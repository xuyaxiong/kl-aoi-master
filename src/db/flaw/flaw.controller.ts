import { Controller, Post, Body } from '@nestjs/common';
import { FlawService } from './flaw.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('flaw')
@Controller('flaw')
export class FlawController {
  constructor(public readonly flawService: FlawService) {}
}
