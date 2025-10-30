import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GeminiService, Recipe } from './services/gemini.service';
import { SupabaseService } from './services/supabase.service';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly geminiService: GeminiService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly supabaseService: SupabaseService,
  ) {}

  /**
   * Gera receitas usando IA com cache
   */
  async generateRecipes(ingredients: string[], userId?: string): Promise<Recipe[]> {
    try {
      // Criar chave do cache baseada nos ingredientes
      const cacheKey = this.createCacheKey(ingredients);
      
      // Verificar cache primeiro
      const cached = await this.cacheManager.get<Recipe[]>(cacheKey);
      if (cached) {
        this.logger.log(`Returning cached recipes for ingredients: ${ingredients.join(', ')}`);
        return cached;
      }

      // Normalizar ingredientes (lowercase, trim)
      const normalizedIngredients = ingredients
        .map(ingredient => ingredient.toLowerCase().trim())
        .filter(ingredient => ingredient.length > 0);

      const recipes = await this.geminiService.generateRecipes(normalizedIngredients);

      // Adicionar IDs únicos às receitas
      const recipesWithIds = recipes.map((recipe, index) => ({
        ...recipe,
        id: this.generateRecipeId(recipe.nome, index),
      }));

      // Cachear o resultado por 1 hora
      await this.cacheManager.set(cacheKey, recipesWithIds, 60 * 60 * 1000);

      return recipesWithIds;

    } catch (error) {
      this.logger.error('Error in generateRecipes:', error);
      throw error;
    }
  }

  /**
   * Cria uma chave de cache baseada nos ingredientes
   */
  private createCacheKey(ingredients: string[]): string {
    const sortedIngredients = ingredients
      .map(i => i.toLowerCase().trim())
      .sort()
      .join('-');
    
    return `recipes:${sortedIngredients}`;
  }

  /**
   * Gera um ID único para a receita
   */
  private generateRecipeId(recipeName: string, index: number): string {
    const timestamp = Date.now();
    const nameSlug = recipeName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    return `${nameSlug}-${timestamp}-${index}`;
  }

  /**
   * Limpa o cache de receitas
   */
  async clearCache(): Promise<void> {
    try {
      await (this.cacheManager as any).reset();
      this.logger.log('Recipe cache cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Exclui a conta do usuário e todos os dados associados
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // Excluir favoritos
      await this.supabaseService.deleteFavoritesByUser(userId);

      await this.supabaseService.deleteUser(userId);

      this.logger.log(`Account deleted for user ${userId}`);
    } catch (error) {
      this.logger.error(`Error deleting account for user ${userId}:`, error);
      throw error;
    }
  }
}