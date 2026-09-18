import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { VisitorResponseDto } from './dto/visitor-response.dto';

// Formato de uma linha da tabela "visitors" (o que o Prisma devolve).
interface VisitorRow {
  id_visitor: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  purpose: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VisitorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVisitorDto): Promise<VisitorResponseDto> {
    if (dto.email) {
      const visitanteComMesmoEmail = await this.prisma.visitor.findUnique({
        where: { email: dto.email },
      });

      if (visitanteComMesmoEmail) {
        throw new ConflictException('Já existe um visitante cadastrado com esse e-mail');
      }
    }

    if (dto.document) {
      const visitanteComMesmoDocumento = await this.prisma.visitor.findUnique({
        where: { document: dto.document },
      });

      if (visitanteComMesmoDocumento) {
        throw new ConflictException('Já existe um visitante cadastrado com esse documento');
      }
    }

    // A procedure exige um placeholder na posição do parâmetro OUT,
    // senão o Postgres não encontra a assinatura da procedure.
    const linhas = await this.prisma.$queryRawUnsafe<{ o_visitor_id: string }[]>(
      'CALL create_visitor($1, $2, $3, $4, $5, $6, NULL)',
      dto.fullName,
      dto.email ?? null,
      dto.phone ?? null,
      dto.company ?? null,
      dto.purpose,
      dto.document ?? null,
    );

    const idDoVisitante = linhas[0].o_visitor_id;

    return this.findById(idDoVisitante);
  }

  async findById(visitorId: string): Promise<VisitorResponseDto> {
    const visitante = await this.prisma.visitor.findUnique({
      where: { id_visitor: visitorId },
    });

    if (!visitante) {
      throw new NotFoundException('Visitante não encontrado');
    }

    return this.mapParaResposta(visitante);
  }

  async getAll(
    skip: number,
    take: number,
  ): Promise<{ data: VisitorResponseDto[]; total: number; skip: number; take: number }> {
    if (skip < 0 || take <= 0) {
      throw new BadRequestException('skip deve ser maior ou igual a 0 e take deve ser maior que 0');
    }

    const [visitantes, total] = await Promise.all([
      this.prisma.visitor.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.visitor.count(),
    ]);

    const data = visitantes.map((visitante) => this.mapParaResposta(visitante));

    return { data, total, skip, take };
  }

  async update(visitorId: string, dto: UpdateVisitorDto): Promise<VisitorResponseDto> {
    const visitante = await this.prisma.visitor.findUnique({ where: { id_visitor: visitorId } });

    if (!visitante) {
      throw new NotFoundException('Visitante não encontrado');
    }

    if (dto.email && dto.email !== visitante.email) {
      const visitanteComMesmoEmail = await this.prisma.visitor.findFirst({
        where: {
          email: dto.email,
          NOT: { id_visitor: visitorId },
        },
      });

      if (visitanteComMesmoEmail) {
        throw new ConflictException('Já existe um visitante cadastrado com esse e-mail');
      }
    }

    const visitanteAtualizado = await this.prisma.visitor.update({
      where: { id_visitor: visitorId },
      data: {
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        purpose: dto.purpose,
      },
    });

    return this.mapParaResposta(visitanteAtualizado);
  }

  // Monta o DTO de resposta a partir da linha do banco, sem cpf/document.
  private mapParaResposta(visitante: VisitorRow): VisitorResponseDto {
    return {
      id: visitante.id_visitor,
      fullName: visitante.fullName,
      email: visitante.email,
      phone: visitante.phone,
      company: visitante.company,
      purpose: visitante.purpose,
      createdAt: visitante.createdAt,
      updatedAt: visitante.updatedAt,
    };
  }
}
