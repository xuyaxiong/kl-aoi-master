import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flaw } from './flaw.entity';

@Injectable()
export class FlawService {
  constructor(
    @InjectRepository(Flaw) private readonly repository: Repository<Flaw>,
  ) {}
}
