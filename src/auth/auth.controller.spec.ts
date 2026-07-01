import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockResponse = {
    accessToken: 'token',
    refreshToken: 'refresh',
    expiresIn: 900,
    user: { id: '1', email: 'hassan@example.com', isActive: true },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: { login: jest.fn() } }],
    }).compile();

    controller = module.get(AuthController);
    authService = module.get(AuthService);
  });

  it('delegates to AuthService.login and returns its result', async () => {
    authService.login.mockResolvedValue(mockResponse as any);

    const result = await controller.login({
      email: 'hassan@example.com',
      password: 'correct-password',
    });

    expect(authService.login).toHaveBeenCalledWith({
      email: 'hassan@example.com',
      password: 'correct-password',
    });
    expect(result).toBe(mockResponse);
  });
});
