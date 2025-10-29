import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  /**
   * Adiciona uma receita aos favoritos do usuário
   */
  async addToFavorites(userId: string, recipeId: string, recipeData: any) {
    try {
      this.logger.log(`Adding recipe ${recipeId} to favorites for user ${userId}`);

      const { data, error } = await this.supabaseService.getAdminClient()
        .from('favorites')
        .upsert(
          {
            user_id: userId,
            recipe_id: recipeId,
            recipe_data: recipeData,
            created_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,recipe_id',
          },
        )
        .select();

      if (error) {
        this.logger.error(`Error adding favorite: ${error.message}`);
        throw error;
      }

      this.logger.log(`Recipe ${recipeId} added to favorites successfully`);
      return {
        success: true,
        data: data[0],
      };
    } catch (error) {
      this.logger.error('Error in addToFavorites:', error);
      throw error;
    }
  }

  /**
   * Remove uma receita dos favoritos do usuário
   */
  async removeFromFavorites(userId: string, recipeId: string) {
    try {
      this.logger.log(`Removing recipe ${recipeId} from favorites for user ${userId}`);

      const { error } = await this.supabaseService.getAdminClient()
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) {
        this.logger.error(`Error removing favorite: ${error.message}`);
        throw error;
      }

      this.logger.log(`Recipe ${recipeId} removed from favorites successfully`);
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Error in removeFromFavorites:', error);
      throw error;
    }
  }

  /**
   * Obtém todos os favoritos do usuário
   */
  async getFavorites(userId: string) {
    try {
      this.logger.log(`Fetching favorites for user ${userId}`);

      const { data, error } = await this.supabaseService.getAdminClient()
        .from('favorites')
        .select('recipe_id, recipe_data, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        this.logger.error(`Error fetching favorites: ${error.message}`);
        throw error;
      }

      this.logger.log(`Retrieved ${data?.length || 0} favorites for user ${userId}`);
      return {
        success: true,
        favorites: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      this.logger.error('Error in getFavorites:', error);
      throw error;
    }
  }

  /**
   * Verifica se uma receita está nos favoritos
   */
  async isFavorite(userId: string, recipeId: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabaseService.getAdminClient()
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('recipe_id', recipeId)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 é o erro de "not found", esperado quando não há favorito
        this.logger.error(`Error checking favorite: ${error.message}`);
        throw error;
      }

      return !!data;
    } catch (error) {
      this.logger.error('Error in isFavorite:', error);
      return false;
    }
  }

  /**
   * Remove todos os favoritos do usuário
   */
  async clearAllFavorites(userId: string) {
    try {
      this.logger.log(`Clearing all favorites for user ${userId}`);

      const { error } = await this.supabaseService.getAdminClient()
        .from('favorites')
        .delete()
        .eq('user_id', userId);

      if (error) {
        this.logger.error(`Error clearing favorites: ${error.message}`);
        throw error;
      }

      this.logger.log(`All favorites cleared for user ${userId}`);
      return {
        success: true,
      };
    } catch (error) {
      this.logger.error('Error in clearAllFavorites:', error);
      throw error;
    }
  }
}
