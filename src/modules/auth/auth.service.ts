import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { UserResponseDto } from '../user/dto/user-response.dto';
import { UserLoginEvent, UserLogoutEvent } from '../../infra/events/auth.events';
import * as argon2 from 'argon2';
import { CryptoService } from '../../common/crypto/crypto.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private crypto: CryptoService,
    private eventEmitter: EventEmitter2,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.userService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await argon2.verify(user.password, loginDto.password);

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
      const jwtConfig = this.configService.get('jwt');
      const payload = this.jwtService.verify(refreshToken, {
        secret: jwtConfig.refresh.secret,
      });

      // Find refresh token in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

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
      await this.prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      // Save new refresh token
      await this.saveRefreshToken(storedToken.user.id, tokens.refreshToken);

      this.logger.log(`Tokens refreshed for user: ${storedToken.user.id}`);

      // Prepare user response
      const userResponse = new UserResponseDto({
        ...storedToken.user,
        phone: storedToken.user.phone ? this.crypto.decrypt(storedToken.user.phone) : undefined,
      });

      return {
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      // Delete specific refresh token
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Delete all refresh tokens for user
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    this.logger.log(`User logged out: ${userId}`);

    // Get user email for event
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      this.eventEmitter.emit(
        'user.logout',
        new UserLogoutEvent(user.id, user.email),
      );
    }
  }

  private async generateTokens(user: any): Promise<{ accessToken: string; refreshToken: string }> {
    const jwtConfig = this.configService.get('jwt');

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
    const jwtConfig = this.configService.get('jwt');
    const expiresIn = jwtConfig.refresh.expiresIn;

    // Parse expiration (e.g., '7d' -> 7 days)
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      throw new Error('Invalid refresh token expiration format');
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    let expiresAt = new Date();
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

    await this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  }
}
