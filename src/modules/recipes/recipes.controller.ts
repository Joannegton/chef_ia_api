import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  Request,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RecipesService } from './recipes.service';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';
import { AuthGuard } from '../../guards/auth.guard';

@Controller('recipes')
@UseGuards(ThrottlerGuard)
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(private readonly recipesService: RecipesService) {}

  /**
   * Gera receitas baseadas nos ingredientes fornecidos
   * POST /api/v1/recipes/generate
   * Requer autenticação via token Supabase
   */
  @Post('generate')
  @UseGuards(AuthGuard)
  async generateRecipes(
    @Body() generateRecipesDto: GenerateRecipesDto,
    @Request() req: any,
  ) {
    try {
      const { ingredients } = generateRecipesDto;
      const userId = req.user?.id;

      this.logger.log(`Generating recipes for user ${userId} with ingredients: ${ingredients.join(', ')}`);

      if (!ingredients || ingredients.length === 0) {
        throw new HttpException(
          'At least one ingredient is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (ingredients.length > 20) {
        throw new HttpException(
          'Maximum 20 ingredients allowed',
          HttpStatus.BAD_REQUEST,
        );
      }

      const recipes = await this.recipesService.generateRecipes(ingredients, userId);

      return {
        success: true,
        recipes,
        metadata: {
          ingredientsCount: ingredients.length,
          recipesGenerated: recipes.length,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error generating recipes:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Failed to generate recipes. Please try again.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Endpoint de teste para verificar se o serviço está funcionando
   * POST /api/v1/recipes/test
   */
  @Post('test')
  async testRecipeGeneration() {
    try {
      const testIngredients = ['tomate', 'frango', 'cebola'];
      const recipes = await this.recipesService.generateRecipes(testIngredients);

      return {
        success: true,
        message: 'Recipe generation service is working',
        testRecipes: recipes,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Test recipe generation failed:', error);
      
      throw new HttpException(
        'Recipe generation service is not available',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}