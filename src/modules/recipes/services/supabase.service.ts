import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private readonly supabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseKey) {
      this.logger.warn('Supabase configuration not found');
      this.supabase = null;
    } else {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized successfully');
    }
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
