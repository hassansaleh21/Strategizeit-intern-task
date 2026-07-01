import { UserResponseDto } from './user-response.dto';

export class LoginResponseDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds, always 900 for a 15-minute access token
  user: UserResponseDto;
}
