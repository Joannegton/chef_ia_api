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
