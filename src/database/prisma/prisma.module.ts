import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Módulo global: qualquer outro módulo pode injetar o PrismaService
// sem precisar importar o PrismaModule de novo.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
