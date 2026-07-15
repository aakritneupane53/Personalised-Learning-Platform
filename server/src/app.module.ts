import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RedisModule } from './redis/redis.module';
import { CourseModule } from './course/course.module';
import { AiModule } from './ai/ai.module';
import { CourseContentModule } from './course-content/course-content.module';
import { UserProgressModule } from './user-progress/user-progress.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.development.local', '.env.development'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('NEON_DB');

        if (!connectionString) {
          throw new Error(
            'NEON_DB connection string is missing from the environment variables configuration.',
          );
        }

        return {
          type: 'postgres' as const,
          url: connectionString,
          ssl: {
            rejectUnauthorized: false,
          },
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    // Per-IP request cap. Individual routes (e.g. AI generation endpoints)
    // tighten this further with @Throttle(...).
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),
    RedisModule,
    UsersModule,
    AuthModule,
    CourseModule,
    AiModule,
    CourseContentModule,
    UserProgressModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
