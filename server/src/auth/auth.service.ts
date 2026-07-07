import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';

import argon2  from 'argon2';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';


@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}


  private async function hashData(data: string): Promise<string> {
    return argon2.hash(data);
    }

    private async function verifyData(hashedData: string, plainData: string): Promise<boolean> {
        return argon2.verify(hashedData, plainData);
    }

  async register(registerDto: RegisterDto): Promise<any> {
    const { email, password, name } = registerDto;

    const userExists = await this.userService.findByEmail(email);
    if (userExists) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password using our utility
    const hashedPassword = await this.hashData(password);

    // Create user with hashed password
    const newUser = await this.userService.create({
      name,
      email,
      password: hashedPassword,
    });

    // Generate tokens right after registration
    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.updateRefreshToken(newUser.id, tokens.refreshToken);

    return {
      user: { id: newUser.id, email: newUser.email },
      ...tokens,
    };
  }

  /**
   * LOGIN
   */
  async login(loginDto: LoginDto): Promise<any> {
    const { email, password } = loginDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password using our utility
    const isPasswordMatching = await verifyData(user.password, password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: { id: user.id, email: user.email },
      ...tokens,
    };
  }


  async logout(userId: number): Promise<void> {
    // Invalidate refresh token by clearing it in the database
    // await this.userService.update(userId, { refreshToken: null });
  }


  async refreshTokens(userId: number, refreshToken: string): Promise<any> {
    
  }

  /**
   * HELPER: Generate Access & Refresh Token pairs
   */
  private async getTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET || 'access_secret_123',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET || 'refresh_secret_456',
        expiresIn: '7d',
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }


  private async updateRefreshToken(userId: number, refreshToken: string) {
    const hashedRefreshToken = await hashData(refreshToken);
    await this.userService.update(userId, {
      refreshToken: hashedRefreshToken, // Assuming you have a 'refreshToken' column in your User entity
    } as any);
  }
}
