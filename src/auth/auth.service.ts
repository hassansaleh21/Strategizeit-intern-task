import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { CredentialsService } from './credentials.service';
import { TokenService } from './token.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/login-response.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly credentialsService: CredentialsService,
    private readonly tokenService: TokenService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.credentialsService.validatePassword(dto.email, dto.password);

    // Bad email or bad password both collapse into the same generic 401 -
    // never reveal which one was wrong.
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new ForbiddenException('This account is inactive');
    }

    const payload: JwtPayload = { sub: user.id, email: user.email };

    const accessToken = this.tokenService.generateAccessToken(payload);
    const refreshToken = await this.tokenService.generateRefreshToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: UserResponseDto.fromEntity(user),
    };
  }
}
