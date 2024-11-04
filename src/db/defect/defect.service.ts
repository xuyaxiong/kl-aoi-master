import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Defect } from './defect.entity';

@Injectable()
export class DefectService {
  constructor(
    @InjectRepository(Defect)
    private readonly repository: Repository<Defect>,
  ) {}
}
