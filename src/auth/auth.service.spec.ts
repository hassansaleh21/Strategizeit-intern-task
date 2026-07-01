import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CredentialsService } from './credentials.service';
import { TokenService } from './token.service';

describe('AuthService', () => {
  let authService: AuthService;
  let credentialsService: jest.Mocked<CredentialsService>;
  let tokenService: jest.Mocked<TokenService>;

  const activeUser = {
    id: 'user-1',
    email: 'hassan@example.com',
    password: 'hashed-password',
    isActive: true,
    firstName: 'Hassan',
    lastName: null,
  };

  const inactiveUser = { ...activeUser, id: 'user-2', isActive: false };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: CredentialsService,
          useValue: { validatePassword: jest.fn() },
        },
        {
          provide: TokenService,
          useValue: {
            generateAccessToken: jest.fn(),
            generateRefreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get(AuthService);
    credentialsService = module.get(CredentialsService);
    tokenService = module.get(TokenService);
  });

  it('returns accessToken, refreshToken, expiresIn and user on valid login', async () => {
    credentialsService.validatePassword.mockResolvedValue(activeUser);
    tokenService.generateAccessToken.mockReturnValue('signed.access.token');
    tokenService.generateRefreshToken.mockResolvedValue('raw-refresh-token');

    const result = await authService.login({
      email: 'hassan@example.com',
      password: 'correct-password',
    });

    expect(result).toEqual({
      accessToken: 'signed.access.token',
      refreshToken: 'raw-refresh-token',
      expiresIn: 900,
      user: {
        id: 'user-1',
        email: 'hassan@example.com',
        firstName: 'Hassan',
        lastName: null,
        isActive: true,
      },
    });
    expect(result.user).not.toHaveProperty('password');
  });

  it('throws 401 UnauthorizedException on bad credentials', async () => {
    credentialsService.validatePassword.mockResolvedValue(null);

    await expect(
      authService.login({ email: 'hassan@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    expect(tokenService.generateRefreshToken).not.toHaveBeenCalled();
  });

  it('throws 403 ForbiddenException for inactive users', async () => {
    credentialsService.validatePassword.mockResolvedValue(inactiveUser);

    await expect(
      authService.login({ email: 'hassan@example.com', password: 'correct-password' }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(tokenService.generateAccessToken).not.toHaveBeenCalled();
    expect(tokenService.generateRefreshToken).not.toHaveBeenCalled();
  });
});
