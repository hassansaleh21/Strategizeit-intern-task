import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Same note as prisma.service.ts - if @formify/common already exports a
 * PrismaModule, delete this and use that one instead.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
