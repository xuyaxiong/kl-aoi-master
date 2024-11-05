import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Defect } from './defect.entity';

@Injectable()
export class DefectService {
  constructor(
    @InjectRepository(Defect)
    private readonly defectRepository: Repository<Defect>,
  ) {}

  async findAll(): Promise<Defect[]> {
    return this.defectRepository.find();
  }

  async findOne(id: number): Promise<Defect> {
    return this.defectRepository.findOneBy({ id });
  }

  async create(defect: Partial<Defect>): Promise<Defect> {
    const newDefect = this.defectRepository.create(defect);
    return this.defectRepository.save(newDefect);
  }

  async update(id: number, updateDefect: Partial<Defect>): Promise<Defect> {
    await this.defectRepository.update(id, updateDefect);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.defectRepository.delete(id);
  }
}
