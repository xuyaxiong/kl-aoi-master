import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Pattern } from './pattern.entity';

@Injectable()
export class PatternService {
  constructor(
    @InjectModel(Pattern) public readonly model: typeof Pattern,
    public eventEmitter: EventEmitter2,
  ) {}
}
