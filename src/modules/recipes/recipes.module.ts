import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { AuthGuard } from '../../guards/auth.guard';
import { GeminiService } from './services/gemini.service';
import { SupabaseService } from './services/supabase.service';

@Module({
  imports: [],
  controllers: [RecipesController],
  providers: [RecipesService, AuthGuard, GeminiService, SupabaseService],
  exports: [RecipesService],
})
export class RecipesModule {}