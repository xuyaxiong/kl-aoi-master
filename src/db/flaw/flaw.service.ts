import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Flaw } from './flaw.entity';

@Injectable()
export class FlawService {
  constructor(@InjectModel(Flaw) public readonly model: typeof Flaw) {}
}
