import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Material } from './material.entity';

@Injectable()
export class MaterialService {
  constructor(@InjectModel(Material) private readonly model: typeof Material) {}
}
