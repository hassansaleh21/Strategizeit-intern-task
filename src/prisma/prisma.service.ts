import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Minimal PrismaService. If your monorepo already has one exported from
 * @formify/common, delete this file and point the imports in
 * credentials.service.ts / token.service.ts / auth.module.ts there instead -
 * this exists purely so the module is runnable standalone.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
