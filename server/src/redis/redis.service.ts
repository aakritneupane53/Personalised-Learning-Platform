import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

@Injectable()
export class RedisService {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      url: this.configService.getOrThrow<string>('UPSTASH_REDIS_REST_URL'),
      token: this.configService.getOrThrow<string>('UPSTASH_REDIS_REST_TOKEN'),
    });
  }

  get client(): Redis {
    return this.redis;
  }
}
