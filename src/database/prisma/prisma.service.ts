import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../../generated/prisma/client';

// Serviço injetável que conecta o Prisma Client ao Postgres usando o
// driver adapter (obrigatório a partir do Prisma 7, que não tem mais o
// motor em Rust) e gerencia a conexão junto com o ciclo de vida do Nest.
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const adaptadorPostgres = new PrismaPg({
      connectionString: configService.get<string>('DATABASE_URL'),
    });

    super({ adapter: adaptadorPostgres });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
