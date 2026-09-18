import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma/prisma.service';
import { VisitStatus } from '../../generated/prisma/enums';
import { CheckoutVisitDto } from './dto/checkout-visit.dto';
import { CreateVisitDto } from './dto/create-visit.dto';
import { VisitResponseDto } from './dto/visit-response.dto';

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

// Formato de uma linha da tabela "visits" (o que o Prisma devolve).
interface VisitRow {
  id_visit: string;
  fk_visitorId: string;
  checkinAt: Date;
  checkoutAt: Date | null;
  status: VisitStatus;
  host: string;
  notes: string | null;
  createdBy: string;
  checkoutBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateVisitDto, userId: string): Promise<VisitResponseDto> {
    const visitante = await this.prisma.visitor.findUnique({
      where: { id_visitor: dto.visitorId },
    });

    if (!visitante) {
      throw new NotFoundException('Visitante não encontrado');
    }

    let visitId: string;

    try {
      // A procedure exige um placeholder na posição do parâmetro OUT,
      // senão o Postgres não encontra a assinatura da procedure.
      const linhas = await this.prisma.$queryRawUnsafe<{ o_visit_id: string }[]>(
        'CALL insert_visit($1, $2, $3, $4, NULL)',
        dto.visitorId,
        dto.host,
        dto.notes ?? null,
        userId,
      );

      visitId = linhas[0].o_visit_id;
    } catch (erro) {
      // A procedure lança "Visitante <id> já possui uma visita ativa" via RAISE EXCEPTION.
      if (erro instanceof Error && erro.message.includes('já possui uma visita ativa')) {
        throw new ConflictException('Visitante já possui uma visita ativa');
      }

      throw erro;
    }

    return this.findById(visitId);
  }

  async checkout(visitId: string, dto: CheckoutVisitDto, userId: string): Promise<VisitResponseDto> {
    const visita = await this.prisma.visit.findUnique({
      where: { id_visit: visitId },
    });

    if (!visita) {
      throw new NotFoundException('Visita não encontrada');
    }

    try {
      await this.prisma.$queryRawUnsafe(
        'CALL checkout_visit($1, $2, $3, NULL)',
        visitId,
        userId,
        dto.notes ?? null,
      );
    } catch (erro) {
      // A procedure lança "Visita <id> não está ativa" via RAISE EXCEPTION.
      if (erro instanceof Error && erro.message.includes('não está ativa')) {
        throw new ConflictException('Visita não está ativa');
      }

      throw erro;
    }

    return this.findById(visitId);
  }

  async getActiveVisits(
    skip: number,
    take: number,
  ): Promise<{ data: VisitResponseDto[]; total: number; skip: number; take: number }> {
    if (skip < 0 || take <= 0) {
      throw new BadRequestException('skip deve ser maior ou igual a 0 e take deve ser maior que 0');
    }

    const [visitas, total] = await Promise.all([
      this.prisma.visit.findMany({
        where: { status: 'ACTIVE' },
        include: { visitor: true },
        orderBy: { checkinAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.visit.count({ where: { status: 'ACTIVE' } }),
    ]);

    const data = visitas.map((visita) => this.mapVisitaParaResposta(visita, visita.visitor));

    return { data, total, skip, take };
  }

  // Busca a visita já com o visitante embutido e monta o DTO de resposta.
  async findById(visitId: string): Promise<VisitResponseDto> {
    const visita = await this.prisma.visit.findUnique({
      where: { id_visit: visitId },
      include: { visitor: true },
    });

    if (!visita) {
      throw new NotFoundException('Visita não encontrada');
    }

    return this.mapVisitaParaResposta(visita, visita.visitor);
  }

  // Monta o DTO do visitante embutido na resposta, sem cpf/document.
  private mapVisitanteParaResposta(visitor: VisitorRow) {
    return {
      id: visitor.id_visitor,
      fullName: visitor.fullName,
      email: visitor.email,
      phone: visitor.phone,
      company: visitor.company,
      purpose: visitor.purpose,
      createdAt: visitor.createdAt,
      updatedAt: visitor.updatedAt,
    };
  }

  // Monta o DTO completo da visita, com o visitante já mapeado dentro.
  private mapVisitaParaResposta(visit: VisitRow, visitor: VisitorRow): VisitResponseDto {
    return {
      id: visit.id_visit,
      visitorId: visit.fk_visitorId,
      visitor: this.mapVisitanteParaResposta(visitor),
      checkinAt: visit.checkinAt,
      checkoutAt: visit.checkoutAt,
      status: visit.status,
      host: visit.host,
      notes: visit.notes,
      createdBy: visit.createdBy,
      checkoutBy: visit.checkoutBy,
      createdAt: visit.createdAt,
      updatedAt: visit.updatedAt,
    };
  }
}
