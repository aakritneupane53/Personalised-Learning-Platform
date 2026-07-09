import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { v4 as uuid } from 'uuid';

import { UsersService } from 'src/users/users.service';
import { RedisService } from 'src/redis/redis.service';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerUserDto: RegisterUserDto) {
    const existingUser = await this.usersService.findByEmail(
      registerUserDto.email,
    );

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await argon2.hash(registerUserDto.password);

    const user = await this.usersService.create({
      ...registerUserDto,
      password: hashedPassword,
    });

    return this.createSession(user.id);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await argon2.verify(user.password, password);

    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.createSession(user.id);
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);

      const userId = payload.sub;
      const sessionId = payload.sid;

      const session = await this.redisService.client.get(
        `session:${sessionId}`,
      );

      if (!session) {
        throw new UnauthorizedException('Session expired');
      }

      const parsedSession = JSON.parse(session);

      const validRefreshToken = await argon2.verify(
        parsedSession.refreshTokenHash,
        refreshToken,
      );

      if (!validRefreshToken) {
        await this.redisService.client.del(`session:${sessionId}`);

        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.createSession(userId, sessionId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken);

      await this.redisService.client.del(`session:${payload.sid}`);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async createSession(userId: string, sessionId?: string) {
    const sid = sessionId ?? uuid();

    const accessToken = await this.jwtService.signAsync(
      {
        sub: userId,
      },
      {
        expiresIn: '15m',
      },
    );

    const refreshToken = await this.jwtService.signAsync(
      {
        sub: userId,
        sid,
      },
      {
        expiresIn: '30d',
      },
    );

    const refreshTokenHash = await argon2.hash(refreshToken);

    await this.redisService.client.set(
      `session:${sid}`,
      JSON.stringify({
        userId,
        refreshTokenHash,
      }),
      'EX',
      60 * 60 * 24 * 30,
    );

    return {
      accessToken,
      refreshToken,
    };
  }
}
