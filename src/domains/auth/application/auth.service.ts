import {
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '@prisma/client';
import type { UserReaderPort } from '@domains/user';
import { USER_READER_PORT, UserResponseDto } from '@domains/user';
import { LoginDto } from '../presentation/dto/login.dto';
import { AuthResponseDto } from '../presentation/dto/auth-response.dto';
import { UserLoginEvent, UserLogoutEvent } from '../domain/events/auth.events';
import type { AuthJwtConfig } from '../domain/types/jwt-config.type';
import * as argon2 from 'argon2';
import { CryptoService } from '@shared/crypto/crypto.service';
import { AuthRepository } from '../infrastructure/auth.repository';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    @Inject(USER_READER_PORT) private readonly userReader: UserReaderPort,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly crypto: CryptoService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.userReader.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(
      user.password,
      loginDto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user);

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    this.logger.log(`User logged in: ${user.id}`);

    // Emit login event
    this.eventEmitter.emit(
      'user.login',
      new UserLoginEvent(user.id, user.email),
    );

    // Prepare user response
    const userResponse = new UserResponseDto({
      ...user,
      phone: user.phone ? this.crypto.decrypt(user.phone) : undefined,
    });

    return {
      user: userResponse,
      accessToken,
      refreshToken,
    };
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    try {
      // Verify refresh token
      const jwtConfig = this.getJwtConfig();
      this.jwtService.verify(refreshToken, {
        secret: jwtConfig.refresh.secret,
      });

      // Find refresh token in database
      const storedToken =
        await this.authRepository.findRefreshTokenWithUser(refreshToken);

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      // Check if user is active
      if (!storedToken.user.isActive) {
        throw new UnauthorizedException('User account is inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(storedToken.user);

      // Delete old refresh token
      await this.authRepository.deleteRefreshToken(refreshToken);

      // Save new refresh token
      await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

      this.logger.log(`Tokens refreshed for user: ${storedToken.user.id}`);

      // Prepare user response
      const userResponse = new UserResponseDto({
        ...storedToken.user,
        phone: storedToken.user.phone
          ? this.crypto.decrypt(storedToken.user.phone)
          : undefined,
      });

      return {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    await this.authRepository.deleteRefreshTokens(userId, refreshToken);

    this.logger.log(`User logged out: ${userId}`);

    // Get user email for event
    const user = await this.authRepository.findUserById(userId);
    if (user) {
      this.eventEmitter.emit(
        'user.logout',
        new UserLogoutEvent(user.id, user.email),
      );
    }
  }

  private async generateTokens(
    user: Pick<User, 'id' | 'email' | 'role'>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtConfig = this.getJwtConfig();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.access.secret,
        expiresIn: jwtConfig.access.expiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: jwtConfig.refresh.secret,
        expiresIn: jwtConfig.refresh.expiresIn,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string): Promise<void> {
    const jwtConfig = this.getJwtConfig();
    const expiresIn = jwtConfig.refresh.expiresIn;
    if (typeof expiresIn !== 'string') {
      throw new Error('Refresh token expiration must be a string like 7d');
    }

    // Parse expiration (e.g., '7d' -> 7 days)
    const match = /^(\d+)([dhms])$/.exec(expiresIn);
    if (!match) {
      throw new Error('Invalid refresh token expiration format');
    }

    const value = Number.parseInt(match[1], 10);
    const unit = match[2] as 'd' | 'h' | 'm' | 's';

    const expiresAt = new Date();
    switch (unit) {
      case 'd':
        expiresAt.setDate(expiresAt.getDate() + value);
        break;
      case 'h':
        expiresAt.setHours(expiresAt.getHours() + value);
        break;
      case 'm':
        expiresAt.setMinutes(expiresAt.getMinutes() + value);
        break;
      case 's':
        expiresAt.setSeconds(expiresAt.getSeconds() + value);
        break;
    }

    await this.authRepository.createRefreshToken(userId, token, expiresAt);
  }

  async validateUser(userId: string) {
    const user = await this.authRepository.findUserById(userId);

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }

  private getJwtConfig(): AuthJwtConfig {
    const jwtConfig = this.configService.get<AuthJwtConfig>('jwt');
    if (!jwtConfig) {
      throw new Error('JWT configuration is missing');
    }
    return jwtConfig;
  }
}
