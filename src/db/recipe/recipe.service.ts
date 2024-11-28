import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './recipe.entity';
import { ConfigService } from '@nestjs/config';
const path = require('path');
import * as fsExtra from 'fs-extra';

@Injectable()
export class RecipeService {
  private recipePath: string;
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    private readonly configService: ConfigService,
  ) {
    this.recipePath = this.configService.get<string>('recipePath');
  }

  private formatRecipePath(id: number, name: string) {
    return path.join(this.recipePath, `${id}.${name}`);
  }

  async findAll(): Promise<Recipe[]> {
    return this.recipeRepository.find({
      order: {
        sort: 'ASC',
      },
    });
  }

  async findById(id: number): Promise<Recipe> {
    return this.recipeRepository.findOneBy({ id });
  }

  async create(recipe: Partial<Recipe>): Promise<Recipe> {
    const newrecipe = this.recipeRepository.create(recipe);
    return this.recipeRepository.save(newrecipe);
  }

  async update(id: number, updaterecipe: Partial<Recipe>): Promise<Recipe> {
    await this.recipeRepository.update(id, updaterecipe);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    const recipeToDelete = await this.findById(id);
    if (recipeToDelete) {
      const recipePath = this.formatRecipePath(
        recipeToDelete.id,
        recipeToDelete.name,
      );
      await this.recipeRepository.delete(id);
      // 同步删除配方目录
      fsExtra.remove(recipePath);
    }
  }

  async copyById(origId: number, name: string) {
    const origRecipe = await this.findById(origId);
    if (origRecipe) {
      const newRecipeObj = { name, config: origRecipe.config };
      const newRecipe = await this.create(newRecipeObj);
      const origRecipePath = this.formatRecipePath(
        origRecipe.id,
        origRecipe.name,
      );
      const newRecipePath = this.formatRecipePath(newRecipe.id, newRecipe.name);
      fsExtra.copySync(origRecipePath, newRecipePath);
    }
  }
}
