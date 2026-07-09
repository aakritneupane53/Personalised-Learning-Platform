import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST'),
      port: Number(this.configService.get('REDIS_PORT')),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
    });
  }

  get client(): Redis {
    return this.redis;
  }
}
