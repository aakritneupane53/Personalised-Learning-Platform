import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Render sits behind a reverse proxy; without this, every request looks
  // like it comes from the proxy's IP, which would make ThrottlerGuard's
  // per-IP rate limiting apply globally instead of per client.
  app.getHttpAdapter().getInstance().set('trust proxy', 1);

  app.use(cookieParser());

  // Comma-separated list of allowed origins, e.g. "https://app.example.com,https://staging.example.com".
  // Trailing slashes are stripped since the browser's Origin header never
  // includes one, and cors matches origins by exact string equality.
  const configuredOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  const corsOrigin =
    configuredOrigins && configuredOrigins.length > 0
      ? configuredOrigins
      : ['http://localhost:3000'];

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
