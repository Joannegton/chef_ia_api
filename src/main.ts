import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Get configuration
  const configService = app.get(ConfigService);
  const port = configService.get('PORT') || 3000;
  const isDevelopment = configService.get('NODE_ENV') === 'development';
  
  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  // CORS configuration - Configuração segura para produção
  const corsOrigin = isDevelopment
    ? [
        'http://localhost:3000',
        'http://localhost:8080',
        'http://localhost:5000',
        'http://localhost:8000',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5000',
        'http://127.0.0.1:8000',
        'http://10.0.2.2:3000' 
      ]
    : (configService.get('CORS_ORIGINS') || 'https://chefia-api-production.up.railway.app')
        .split(',')
        .map(origin => origin.trim());

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: false,
  });

  app.setGlobalPrefix('api/v1');
  
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get('NODE_ENV'),
      version: '1.0.0',
    });
  });
  
  await app.listen(port, '0.0.0.0');
  
}

bootstrap();