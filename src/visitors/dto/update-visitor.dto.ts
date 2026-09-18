import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, Matches, MinLength } from 'class-validator';

// Telefone sem máscara: só números, com DDD (10 ou 11 dígitos).
const REGEX_PHONE = /^\d{10,11}$/;

export class UpdateVisitorDto {
  @ApiPropertyOptional({ description: 'Nome completo do visitante', example: 'Maria da Silva Atualizado' })
  @IsOptional()
  @MinLength(3, { message: 'o nome completo deve ter no mínimo 3 caracteres' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'E-mail do visitante', example: 'novo.email@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'insira um email válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Telefone do visitante, apenas números com DDD (10 ou 11 dígitos)',
    example: '11987654321',
  })
  @IsOptional()
  @Matches(REGEX_PHONE, {
    message: 'telefone deve conter somente números, com 10 dígitos (fixo) ou 11 dígitos (celular), incluindo o DDD',
  })
  phone?: string;

  @ApiPropertyOptional({ description: 'Empresa que o visitante representa', example: 'Nova Empresa Ltda' })
  @IsOptional()
  company?: string;

  @ApiPropertyOptional({ description: 'Motivo da visita', example: 'Reunião de acompanhamento' })
  @IsOptional()
  @MinLength(5, { message: 'o motivo da visita deve ter no mínimo 5 caracteres' })
  purpose?: string;
}
