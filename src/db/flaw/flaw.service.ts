import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { Flaw } from './flaw.entity';

@Injectable()
export class FlawService {
  constructor(
    @InjectRepository(Flaw)
    private readonly flawRepository: Repository<Flaw>,
  ) {}

  async findAll(
    materialId: string,
    patternId: number,
    imgIndex: number,
  ): Promise<Flaw[]> {
    const queryBuilder = this.flawRepository.createQueryBuilder('flaw');
    if (materialId) {
      queryBuilder.andWhere('flaw.materialId = :materialId', {
        materialId,
      });
    }
    if (patternId) {
      queryBuilder.andWhere('flaw.patternId = :patternId', {
        patternId,
      });
    }
    if (imgIndex !== null && imgIndex !== undefined) {
      queryBuilder.andWhere('flaw.imgIndex = :imgIndex', {
        imgIndex,
      });
    }
    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Flaw> {
    return this.flawRepository.findOneBy({ id });
  }

  async create(flaw: Partial<Flaw>): Promise<Flaw> {
    const newFlaw = this.flawRepository.create(flaw);
    return this.flawRepository.save(newFlaw);
  }

  async saveInBatch(flaws: Partial<Flaw>[]): Promise<InsertResult> {
    return this.flawRepository.insert(flaws);
  }

  async update(id: number, updateFlaw: Partial<Flaw>): Promise<Flaw> {
    await this.flawRepository.update(id, updateFlaw);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.flawRepository.delete(id);
  }
}
