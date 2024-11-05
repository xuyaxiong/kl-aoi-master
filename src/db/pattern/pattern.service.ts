import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pattern } from './pattern.entity';

@Injectable()
export class PatternService {
  constructor(
    @InjectRepository(Pattern)
    private readonly patternRepository: Repository<Pattern>,
  ) {}

  async findAll(): Promise<Pattern[]> {
    return this.patternRepository.find();
  }

  async findOne(id: number): Promise<Pattern> {
    return this.patternRepository.findOneBy({ id });
  }

  async create(pattern: Partial<Pattern>): Promise<Pattern> {
    const newPattern = this.patternRepository.create(pattern);
    return this.patternRepository.save(newPattern);
  }

  async update(id: number, updatePattern: Partial<Pattern>): Promise<Pattern> {
    await this.patternRepository.update(id, updatePattern);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.patternRepository.delete(id);
  }
}
