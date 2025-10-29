import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { GeminiService, Recipe } from './services/gemini.service';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);

  constructor(
    private readonly grokService: GeminiService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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

      // Gerar receitas com Grok
      this.logger.log(`Generating new recipes for: ${normalizedIngredients.join(', ')}`);
      const recipes = await this.grokService.generateRecipes(normalizedIngredients);

      // Adicionar IDs únicos às receitas
      const recipesWithIds = recipes.map((recipe, index) => ({
        ...recipe,
        id: this.generateRecipeId(recipe.nome, index),
      }));

      // Cachear o resultado por 1 hora
      await this.cacheManager.set(cacheKey, recipesWithIds, 60 * 60 * 1000);

      this.logger.log(`Generated ${recipesWithIds.length} recipes successfully`);
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
      await this.cacheManager.reset();
      this.logger.log('Recipe cache cleared successfully');
    } catch (error) {
      this.logger.error('Error clearing cache:', error);
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  async getCacheStats(): Promise<any> {
    try {
      // Nota: cache-manager não fornece estatísticas por padrão
      // Esta implementação é básica
      return {
        status: 'active',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return { status: 'error' };
    }
  }
}