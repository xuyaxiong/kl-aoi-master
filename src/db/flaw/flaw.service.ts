import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Flaw } from './flaw.entity';

@Injectable()
export class FlawService {
  constructor(
    @InjectRepository(Flaw)
    private readonly flawRepository: Repository<Flaw>,
  ) {}

  async findAll(): Promise<Flaw[]> {
    return this.flawRepository.find();
  }

  async findOne(id: number): Promise<Flaw> {
    return this.flawRepository.findOneBy({ id });
  }

  async create(flaw: Partial<Flaw>): Promise<Flaw> {
    const newFlaw = this.flawRepository.create(flaw);
    return this.flawRepository.save(newFlaw);
  }

  async update(id: number, updateFlaw: Partial<Flaw>): Promise<Flaw> {
    await this.flawRepository.update(id, updateFlaw);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.flawRepository.delete(id);
  }
}
