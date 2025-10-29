import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { SupabaseService } from '../modules/recipes/services/supabase.service';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extrair o token do header Authorization
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      this.logger.warn('No authorization header provided');
      throw new UnauthorizedException('Missing authorization header');
    }

    // Formato esperado: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      this.logger.warn('Invalid authorization header format');
      throw new UnauthorizedException('Invalid authorization header format');
    }

    // Verificar o token com Supabase
    const user = await this.supabaseService.verifyUser(token);
    
    if (!user) {
      this.logger.warn('Invalid or expired token');
      throw new UnauthorizedException('Invalid or expired token');
    }

    // Adicionar usuário ao objeto request
    request.user = user;
    
    this.logger.log(`User ${user.id} authenticated successfully`);
    return true;
  }
}
