import { Controller } from '@nestjs/common';
import { PatternService } from './pattern.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('pattern')
@Controller('pattern')
export class PatternController {
  constructor(public readonly service: PatternService) {}
}
