import { UserResponseDto } from '@domains/user';

export class AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}
