import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './material.entity';

@Injectable()
export class MaterialService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  async findAll(): Promise<Material[]> {
    return this.materialRepository.find();
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
