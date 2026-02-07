import { UserResponseDto } from '../../../../domains/user/presentation/dto/user-response.dto';

export class AuthResponseDto {
  user: UserResponseDto;
  accessToken: string;
  refreshToken: string;
}
