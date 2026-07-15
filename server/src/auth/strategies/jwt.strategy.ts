import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UsersService } from 'src/users/users.service';
import { RedisService } from 'src/redis/redis.service';
import { User } from 'src/users/entities/user.entity';

type SafeUser = Omit<User, 'password'>;

// Every authenticated request re-validates here, so a short TTL turns the
// per-request DB lookup into an in-memory Redis read for almost all traffic.
// No explicit invalidation exists yet since there's no "update user" endpoint;
// worst case a stale user object lives for up to this long.
const USER_CACHE_TTL_SECONDS = 60;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    const cacheKey = `auth:user:${payload.sub}`;
    const cached = await this.redisService.client.get<SafeUser>(cacheKey);

    if (cached) {
      return cached;
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      return null;
    }

    const { password, ...safeUser } = user;

    // Cache the stripped, password-free object only — never write the hash to Redis.
    await this.redisService.client.set(cacheKey, safeUser, {
      ex: USER_CACHE_TTL_SECONDS,
    });

    return safeUser;
  }
}
