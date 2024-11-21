import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { Recipe } from './recipe.entity';
import HttpResponse from 'src/utils/api_res';
import { CopyRecipeParam } from './recipe.param';

@Controller('recipe')
export class RecipeController {
  constructor(private readonly recipeService: RecipeService) {}

  @Get()
  async findAll(): Promise<HttpResponse<Recipe[]>> {
    return HttpResponse.ok(await this.recipeService.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<HttpResponse<Recipe>> {
    return HttpResponse.ok(await this.recipeService.findById(id));
  }

  @Post()
  async create(
    @Body() createrecipe: Partial<Recipe>,
  ): Promise<HttpResponse<Recipe>> {
    return HttpResponse.ok(await this.recipeService.create(createrecipe));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updaterecipe: Partial<Recipe>,
  ): Promise<HttpResponse<Recipe>> {
    return HttpResponse.ok(await this.recipeService.update(id, updaterecipe));
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<HttpResponse<void>> {
    return HttpResponse.ok(await this.recipeService.delete(id));
  }

  @Post('copy')
  async copyById(@Body() copyRecipeParam: CopyRecipeParam): Promise<any> {
    try {
      return HttpResponse.ok(
        await this.recipeService.copyById(
          copyRecipeParam.id,
          copyRecipeParam.name,
        ),
      );
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }
}
