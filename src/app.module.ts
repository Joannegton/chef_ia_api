import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';

import { RecipesModule } from './modules/recipes/recipes.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    
    // Rate limiting - 100 requests per minute
    ThrottlerModule.forRoot([{
      ttl: 60000, // 1 minute
      limit: 100,
    }]),
    
    // Caching
    CacheModule.register({
      isGlobal: true,
      ttl: 60 * 60 * 1000, // 1 hour
      max: 100, // max items in cache
    }),
    
    RecipesModule,
  ],
})
export class AppModule {}