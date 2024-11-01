import { Controller } from '@nestjs/common';
import { DefectService } from './defect.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('defect')
@Controller('defect')
export class DefectController {
  constructor(private readonly defectService: DefectService) {}
}
