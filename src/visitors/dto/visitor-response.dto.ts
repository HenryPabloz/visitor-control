import { ApiProperty } from '@nestjs/swagger';

// Formato do visitante devolvido pela API — cpf e document são sensíveis
// e nunca aparecem aqui (só quem tem a permissão VISITOR_VIEW_SENSITIVE
// deve receber esses dois campos, em outro DTO).
export class VisitorResponseDto {
  @ApiProperty({ description: 'Id do visitante', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Nome completo do visitante', example: 'Maria da Silva' })
  fullName: string;

  @ApiProperty({ description: 'E-mail do visitante', example: 'maria.silva@example.com', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'Telefone do visitante', example: '11987654321', nullable: true })
  phone: string | null;

  @ApiProperty({ description: 'Empresa que o visitante representa', example: 'Acme Ltda', nullable: true })
  company: string | null;

  @ApiProperty({ description: 'Motivo da visita', example: 'Reunião com o time comercial' })
  purpose: string;

  @ApiProperty({ description: 'Data de criação do registro', example: '2026-09-17T16:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do registro', example: '2026-09-17T16:30:00.000Z' })
  updatedAt: Date;
}
