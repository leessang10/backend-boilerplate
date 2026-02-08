import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService, JwtPayload } from '@domains/auth';
import type { AuthJwtConfig } from '@domains/auth';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const jwtConfig = configService.get<AuthJwtConfig>('jwt');
    if (!jwtConfig) {
      throw new Error('JWT configuration is missing');
    }
    super({
      jwtFromRequest: ExtractJwt.fromBodyField('refreshToken'),
      ignoreExpiration: false,
      secretOrKey: jwtConfig.refresh.secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
