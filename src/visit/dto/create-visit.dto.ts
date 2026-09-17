import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateVisitDto {
  @ApiProperty({
    description: 'Id do visitante que está fazendo o check-in',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID(undefined, { message: 'visitorId deve ser um uuid válido' })
  visitorId: string;

  @ApiProperty({ description: 'Nome de quem está recebendo o visitante', example: 'João Pereira' })
  @MinLength(3, { message: 'o nome do responsável deve ter no mínimo 3 caracteres' })
  host: string;

  @ApiPropertyOptional({ description: 'Observações sobre a visita', example: 'Visita agendada previamente' })
  @IsOptional()
  @MaxLength(500, { message: 'a observação deve ter no máximo 500 caracteres' })
  notes?: string;
}
