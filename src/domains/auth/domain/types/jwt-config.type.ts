import type { JwtSignOptions } from '@nestjs/jwt';

export interface AuthJwtConfig {
  access: {
    secret: string;
    expiresIn: JwtSignOptions['expiresIn'];
  };
  refresh: {
    secret: string;
    expiresIn: JwtSignOptions['expiresIn'];
  };
}
