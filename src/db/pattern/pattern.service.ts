import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Pattern } from './pattern.entity';

@Injectable()
export class PatternService {
  constructor(@InjectModel(Pattern) private readonly model: typeof Pattern) {}
}
