import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './recipe.entity';

@Injectable()
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private readonly recipeRepository: Repository<Recipe>,
  ) {}

  async findAll(): Promise<Recipe[]> {
    return this.recipeRepository.find();
  }

  async findOne(id: number): Promise<Recipe> {
    return this.recipeRepository.findOneBy({ id });
  }

  async create(recipe: Partial<Recipe>): Promise<Recipe> {
    const newrecipe = this.recipeRepository.create(recipe);
    return this.recipeRepository.save(newrecipe);
  }

  async update(id: number, updaterecipe: Partial<Recipe>): Promise<Recipe> {
    await this.recipeRepository.update(id, updaterecipe);
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    await this.recipeRepository.delete(id);
  }
}
