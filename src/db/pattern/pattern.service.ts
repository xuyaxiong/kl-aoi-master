import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pattern } from './pattern.entity';

@Injectable()
export class PatternService {
  constructor(
    @InjectRepository(Pattern)
    private readonly repository: Repository<Pattern>,
  ) {}
}
