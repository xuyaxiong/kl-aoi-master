import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { Material } from './material.entity';
import { QueryParam } from './material.param';
import { PageRes } from './material.types';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async findAll(queryParam: QueryParam): Promise<PageRes<Material>> {
    const queryBuilder = this.materialRepository.createQueryBuilder('material');
    if (queryParam.recipeId) {
      queryBuilder.andWhere('material.recipeId = :recipeId', {
        recipeId: `%${queryParam.recipeId}%`,
      });
    }
    if (queryParam.materialId) {
      queryBuilder.andWhere('material.id LIKE :materialId', {
        materialId: `%${queryParam.materialId}%`,
      });
    }
    if (queryParam.sn) {
      queryBuilder.andWhere('material.sn LIKE :sn', {
        sn: `%${queryParam.sn}%`,
      });
    }
    if (queryParam.startTime) {
      queryBuilder.andWhere('material.startTime > :start', {
        start: new Date(queryParam.startTime[0]),
      });
      queryBuilder.andWhere('material.startTime < :end', {
        end: new Date(queryParam.startTime[1]),
      });
    }
    if (queryParam.detectNG !== undefined && queryParam.detectNG !== null) {
      queryBuilder.andWhere('material.detectNG = :detectNG', {
        detectNG: `%${queryParam.detectNG}%`,
      });
    }
    if (queryParam.affirmNG !== undefined && queryParam.affirmNG !== null) {
      queryBuilder.andWhere('material.affirmNG = :affirmNG', {
        affirmNG: `%${queryParam.affirmNG}%`,
      });
    }
    if (queryParam.defectId !== undefined && queryParam.defectId !== null) {
      queryBuilder
        .where("CONCAT(',', material.detectResult, ',') LIKE :detectResult", {
          detectResult: `%,${queryParam.defectId},%`,
        })
        .orWhere("CONCAT(',', material.affirmResult, ',') LIKE :affirmResult", {
          affirmResult: `%,${queryParam.defectId},%`,
        });
    }
    const skipNum = (queryParam.page - 1) * queryParam.pageSize;
    const [data, total] = await queryBuilder
      .orderBy('material.startTime', queryParam.sort)
      .skip(skipNum)
      .take(queryParam.pageSize)
      .getManyAndCount();
    return {
      items: data,
      pageInfo: {
        total,
        page: queryParam.page,
        pageSize: queryParam.pageSize,
        totalPage: Math.ceil(total / queryParam.pageSize),
      },
    };
  }

  async findOne(id: string): Promise<Material> {
    return this.materialRepository.findOneBy({ id });
  }

  async create(material: Partial<Material>): Promise<Material> {
    const newMaterial = this.materialRepository.create(material);
    return this.materialRepository.save(newMaterial);
  }

  async update(
    id: string,
    updateMaterial: Partial<Material>,
  ): Promise<Material> {
    await this.materialRepository.update(id, updateMaterial);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.materialRepository.delete(id);
  }
}
