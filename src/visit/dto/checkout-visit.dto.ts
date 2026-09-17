import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';

export class CheckoutVisitDto {
  @ApiPropertyOptional({ description: 'Observações sobre o check-out', example: 'Visitante saiu acompanhado' })
  @IsOptional()
  @MaxLength(500, { message: 'a observação deve ter no máximo 500 caracteres' })
  notes?: string;
}
