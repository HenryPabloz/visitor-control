import { ApiProperty } from '@nestjs/swagger';
import { VisitStatus } from '../../../generated/prisma/enums';
import { VisitorResponseDto } from '../../visitors/dto/visitor-response.dto';

// Formato da visita devolvida pela API, já com o visitante embutido
// (evita o front-end precisar fazer uma segunda chamada só pra exibir os dados dele).
export class VisitResponseDto {
  @ApiProperty({ description: 'Id da visita', example: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ description: 'Id do visitante dessa visita', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  visitorId: string;

  @ApiProperty({ description: 'Dados do visitante embutidos na resposta', type: VisitorResponseDto })
  visitor: VisitorResponseDto;

  @ApiProperty({ description: 'Data e hora do check-in', example: '2026-09-17T16:30:00.000Z' })
  checkinAt: Date;

  @ApiProperty({ description: 'Data e hora do check-out', example: '2026-09-17T18:00:00.000Z', nullable: true })
  checkoutAt: Date | null;

  @ApiProperty({ description: 'Status atual da visita', enum: ['ACTIVE', 'CLOSED'], example: 'ACTIVE' })
  status: VisitStatus;

  @ApiProperty({ description: 'Nome de quem está recebendo o visitante', example: 'João Pereira' })
  host: string;

  @ApiProperty({ description: 'Observações sobre a visita', example: 'Visita agendada previamente', nullable: true })
  notes: string | null;

  @ApiProperty({
    description: 'Id do usuário que registrou o check-in',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  })
  createdBy: string;

  @ApiProperty({
    description: 'Id do usuário que registrou o check-out',
    example: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    nullable: true,
  })
  checkoutBy: string | null;

  @ApiProperty({ description: 'Data de criação do registro', example: '2026-09-17T16:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do registro', example: '2026-09-17T18:00:00.000Z' })
  updatedAt: Date;
}
