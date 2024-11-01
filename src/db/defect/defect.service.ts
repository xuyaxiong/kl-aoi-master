import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Defect } from './defect.entity';

@Injectable()
export class DefectService {
  constructor(@InjectModel(Defect) public readonly model: typeof Defect) {}
}
