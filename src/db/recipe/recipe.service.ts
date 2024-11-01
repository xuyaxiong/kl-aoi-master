import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Recipe } from './recipe.entity';

@Injectable()
export class RecipeService {
  constructor(@InjectModel(Recipe) private readonly model: typeof Recipe) {}
}
