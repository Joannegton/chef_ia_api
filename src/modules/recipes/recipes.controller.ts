import { 
  Controller, 
  Post, 
  Get,
  Delete,
  Body, 
  UseGuards, 
  Request,
  Param,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RecipesService } from './recipes.usecases';
import { FavoritesService } from './services/favorites.service';
import { GenerateRecipesDto } from './dto/generate-recipes.dto';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { AuthGuard } from '../../guards/auth.guard';

@Controller('recipes')
@UseGuards(ThrottlerGuard)
export class RecipesController {
  private readonly logger = new Logger(RecipesController.name);

  constructor(
    private readonly recipesService: RecipesService,
    private readonly favoritesService: FavoritesService,
  ) {}

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
      this.logger.error(`❌ Erro na geração de receitas:`, error);
      
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

  /**
   * Adiciona uma receita aos favoritos
   * POST /api/v1/recipes/favorites
   * Requer autenticação
   */
  @Post('favorites')
  @UseGuards(AuthGuard)
  async addToFavorites(
    @Body() addFavoriteDto: AddFavoriteDto,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }

      const result = await this.favoritesService.addToFavorites(
        userId,
        addFavoriteDto.recipeId,
        addFavoriteDto.recipeData,
      );

      return {
        success: true,
        message: 'Recipe added to favorites',
        data: result.data,
      };
    } catch (error) {
      this.logger.error('Error adding to favorites:', error);
      throw new HttpException(
        'Failed to add recipe to favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Remove uma receita dos favoritos
   * DELETE /api/v1/recipes/favorites/:recipeId
   * Requer autenticação
   */
  @Delete('favorites/:recipeId')
  @UseGuards(AuthGuard)
  async removeFromFavorites(
    @Param('recipeId') recipeId: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }

      const result = await this.favoritesService.removeFromFavorites(userId, recipeId);

      return {
        success: true,
        message: 'Recipe removed from favorites',
        data: result,
      };
    } catch (error) {
      this.logger.error('Error removing from favorites:', error);
      throw new HttpException(
        'Failed to remove recipe from favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtém todos os favoritos do usuário
   * GET /api/v1/recipes/favorites
   * Requer autenticação
   */
  @Get('favorites')
  @UseGuards(AuthGuard)
  async getFavorites(@Request() req: any) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }

      const result = await this.favoritesService.getFavorites(userId);

      return result;
    } catch (error) {
      this.logger.error('Error fetching favorites:', error);
      throw new HttpException(
        'Failed to fetch favorites',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Verifica se uma receita está nos favoritos
   * GET /api/v1/recipes/favorites/check/:recipeId
   * Requer autenticação
   */
  @Get('favorites/check/:recipeId')
  @UseGuards(AuthGuard)
  async checkFavorite(
    @Param('recipeId') recipeId: string,
    @Request() req: any,
  ) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }

      const isFavorite = await this.favoritesService.isFavorite(userId, recipeId);

      return {
        success: true,
        recipeId,
        isFavorite,
      };
    } catch (error) {
      this.logger.error('Error checking favorite:', error);
      throw new HttpException(
        'Failed to check favorite status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Exclui a conta do usuário e todos os dados associados
   * DELETE /api/v1/recipes/user/account
   * Requer autenticação
   */
  @Delete('user/account')
  @UseGuards(AuthGuard)
  async deleteAccount(@Request() req: any) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
      }

      await this.recipesService.deleteUserAccount(userId);

      return {
        success: true,
        message: 'Conta excluída com sucesso',
      };
    } catch (error) {
      this.logger.error('Error deleting account:', error);
      throw new HttpException(
        'Failed to delete account',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
