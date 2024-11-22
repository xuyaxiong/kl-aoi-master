import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InsertResult, Repository } from 'typeorm';
import { Flaw } from './flaw.entity';
import { QueryParam } from './flaw.param';

@Injectable()
export class FlawService {
  constructor(
    @InjectRepository(Flaw)
    private readonly flawRepository: Repository<Flaw>,
  ) {}

  async findAll(queryParam: QueryParam): Promise<Flaw[]> {
    const queryBuilder = this.flawRepository.createQueryBuilder('flaw');
    if (queryParam.materialId) {
      queryBuilder.andWhere('flaw.materialId = :materialId', {
        materialId: queryParam.materialId,
      });
    }
    if (queryParam.patternId) {
      queryBuilder.andWhere('flaw.patternId = :patternId', {
        patternId: queryParam.patternId,
      });
    }
    if (queryParam.imgIndex !== null || queryParam.imgIndex !== undefined) {
      queryBuilder.andWhere('flaw.imgIndex = :imgIndex', {
        imgIndex: queryParam.imgIndex,
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
