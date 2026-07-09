import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';

import { AppModule } from './app.module';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
   app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,               // Strips out properties not explicitly defined in the DTO
      forbidNonWhitelisted: true,    // Throws an error if extra non-whitelisted properties are sent
      transform: true,               // Automatically transforms payloads to match DTO class types
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
