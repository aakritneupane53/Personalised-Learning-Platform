import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());

  // Comma-separated list of allowed origins, e.g. "https://app.example.com,https://staging.example.com"
  const corsOrigin = process.env.CORS_ORIGIN?.split(',').map((origin) =>
    origin.trim(),
  ) ?? ['http://localhost:3000'];

  app.enableCors({
    origin: corsOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strips out properties not explicitly defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if extra non-whitelisted properties are sent
      transform: true, // Automatically transforms payloads to match DTO class types
    }),
  );
  await app.listen(process.env.PORT ?? 8000);
}
bootstrap();
