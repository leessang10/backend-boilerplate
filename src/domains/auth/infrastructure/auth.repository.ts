import { Injectable } from '@nestjs/common';
import { Prisma, RefreshToken, User } from '@prisma/client';
import { PrismaService } from '@infra/prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findRefreshTokenWithUser(
    token: string,
  ): Promise<(RefreshToken & { user: User }) | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
  }

  deleteRefreshToken(token: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  createRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }

  deleteRefreshTokens(
    userId: string,
    refreshToken?: string,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.deleteMany({
      where: refreshToken
        ? {
            userId,
            token: refreshToken,
          }
        : {
            userId,
          },
    });
  }

  findUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
