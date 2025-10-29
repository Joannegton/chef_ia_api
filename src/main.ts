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
  
  // CORS configuration
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
        'http://10.0.2.2:3000',  // Android emulator
        '*'  // Allow all origins in development
      ]
    : (configService.get('CORS_ORIGINS') || 'https://chefia.up.railway.app')
        .split(',')
        .map(origin => origin.trim());

  app.enableCors({
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });
  
  // Global prefix
  app.setGlobalPrefix('api/v1');
  
  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: configService.get('NODE_ENV'),
      version: '1.0.0',
    });
  });
  
  // Listen on all interfaces (0.0.0.0) to allow connections from network devices
  // This enables connection from mobile devices and other machines on the network
  await app.listen(port, '0.0.0.0');
  
  console.log(`🚀 ChefIA Backend running on port ${port}`);
  console.log(`📍 Environment: ${configService.get('NODE_ENV')}`);
  console.log(`🔗 Health check: http://localhost:${port}/health`);
  console.log(`📚 API docs: http://localhost:${port}/api/v1`);
}

bootstrap();