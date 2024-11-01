import { Controller } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('recipe')
@Controller('recipe')
export class RecipeController {
  constructor(public readonly recipeService: RecipeService) {}
}
