import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './recipe.entity';
import { ConfigService } from '@nestjs/config';
const path = require('path');
import * as fsExtra from 'fs-extra';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(): Promise<Recipe[]> {
    return this.recipeRepository.find();
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
    await this.recipeRepository.delete(id);
  }

  async copyById(origId: number, name: string) {
    const origRecipe = await this.findById(origId);
    const newRecipeObj = { name, config: origRecipe.config };
    const newRecipe = await this.create(newRecipeObj);
    const recipePath = this.configService.get<string>('recipePath');
    const origRecipePath = path.join(
      recipePath,
      `${origRecipe.id}.${origRecipe.name}`,
    );
    const newRecipePath = path.join(
      recipePath,
      `${newRecipe.id}.${newRecipe.name}`,
    );
    fsExtra.copySync(origRecipePath, newRecipePath);
  }
}
