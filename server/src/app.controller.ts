import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RedisService } from './redis/redis.service';

@Controller()
export class AppController {
  constructor(
    private readonly redisService: RedisService,
    private readonly appService: AppService,
  ) {}

  @Get('health')
  getHealth(): string {
    return this.appService.getHealth();
  }
  @Get('redis')
  async PingRedis() {
    return await this.redisService.client.ping();
  }
}
