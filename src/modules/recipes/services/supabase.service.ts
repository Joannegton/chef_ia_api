import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabase: SupabaseClient;
  private readonly supabaseAdmin: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase configuration not found');
      this.supabase = null;
      this.supabaseAdmin = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      
      // Cliente admin (service role) para operações do backend
      this.supabaseAdmin = createClient(
        supabaseUrl,
        supabaseServiceRoleKey || supabaseKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );
      
      this.logger.log('Supabase clients initialized successfully');
    }
  }

  /**
   * Obtém o cliente Supabase anônimo (para verificação de auth)
   */
  getClient(): SupabaseClient {
    if (!this.supabase) {
      throw new Error('Supabase client not initialized');
    }
    return this.supabase;
  }

  /**
   * Obtém o cliente Supabase admin (para operações do backend com RLS)
   */
  getAdminClient(): SupabaseClient {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }
    return this.supabaseAdmin;
  }

  /**
   * Exclui todos os favoritos de um usuário
   */
  async deleteFavoritesByUser(userId: string) {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { error } = await this.supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId);

    if (error) {
      this.logger.error(`Error deleting favorites for user ${userId}:`, error);
      throw new Error(`Failed to delete favorites: ${error.message}`);
    }

    this.logger.log(`Favorites deleted for user ${userId}`);
  }

  /**
   * Exclui o usuário do Supabase Auth (requer service role key)
   */
  async deleteUser(userId: string) {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const { error } = await this.supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      this.logger.error(`Error deleting user ${userId}:`, error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    this.logger.log(`User ${userId} deleted from Supabase Auth`);
  }

  /**
   * Salva feedback na tabela 'feedback'
   */
  async saveFeedback(payload: { message: string; email?: string | null }) {
    if (!this.supabaseAdmin) {
      throw new Error('Supabase admin client not initialized');
    }

    const record = {
      message: payload.message,
      email: payload.email,
      created_at: new Date().toISOString(),
    };

    const { error } = await this.supabaseAdmin.from('feedback').insert(record);

    if (error) {
      this.logger.error('Error inserting feedback:', error);
      throw new Error(`Failed to save feedback: ${error.message}`);
    }

    this.logger.log('Feedback inserted');
  }

  /**
   * Verifica se o usuário é válido usando o token JWT do Supabase
   */
  async verifyUser(token: string) {
    if (!this.supabase) {
      this.logger.warn('Supabase not configured');
      return null;
    }

    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      
      if (error) {
        this.logger.warn(`Authentication verification failed: ${error.message}`);
        return null;
      }

      return data.user;
    } catch (error) {
      this.logger.error('Error verifying user authentication:', error);
      return null;
    }
  }
}
