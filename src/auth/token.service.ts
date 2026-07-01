import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

const REFRESH_TOKEN_BYTES = 64;
const REFRESH_TOKEN_HASH_ROUNDS = 10;

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  generateAccessToken(payload: JwtPayload): string {
    const privateKey = this.configService.get<string>('jwt.privateKey');
    const ttl = this.configService.get<number>('jwt.accessTokenTtlSeconds');

    return this.jwtService.sign(payload, {
      privateKey,
      algorithm: 'RS256',
      expiresIn: ttl,
    });
  }

  /**
   * Issues a new refresh token: a random opaque string is returned to the
   * client, while only its bcrypt hash is persisted. The raw token is never
   * stored or logged - if the DB is ever compromised, refresh tokens can't
   * be replayed straight from it.
   */
  async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(REFRESH_TOKEN_BYTES).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, REFRESH_TOKEN_HASH_ROUNDS);

    const ttlDays = this.configService.get<number>('jwt.refreshTokenTtlDays') ?? 7;
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        hashedToken,
        expiresAt,
      },
    });

    return rawToken;
  }
}
