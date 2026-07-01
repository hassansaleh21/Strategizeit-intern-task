import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CredentialsService } from './credentials.service';
import { TokenService } from './token.service';
import jwtConfig from './config/jwt.config';
// Adjust to your shared Prisma module location (e.g. '@formify/common').
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule.forFeature(jwtConfig), JwtModule.register({}), PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, CredentialsService, TokenService],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
