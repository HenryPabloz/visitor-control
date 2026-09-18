import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';

// Telefone sem máscara: só números, com DDD (10 ou 11 dígitos).
const REGEX_PHONE = /^\d{10,11}$/;

export class CreateVisitorDto {
  @ApiProperty({ description: 'Nome completo do visitante', example: 'Maria da Silva' })
  @IsNotEmpty({ message: 'preencha o nome completo' })
  @MinLength(3, { message: 'o nome completo deve ter no mínimo 3 caracteres' })
  fullName!: string;

  @ApiPropertyOptional({ description: 'E-mail do visitante', example: 'maria.silva@example.com' })
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

  @ApiPropertyOptional({ description: 'Empresa que o visitante representa', example: 'Acme Ltda' })
  @IsOptional()
  company?: string;

  @ApiProperty({ description: 'Motivo da visita', example: 'Reunião com o time comercial' })
  @IsNotEmpty({ message: 'preencha o motivo da visita' })
  @MinLength(5, { message: 'o motivo da visita deve ter no mínimo 5 caracteres' })
  purpose?: string;

  @ApiPropertyOptional({
    description:
      'Documento de identificação do visitante: aceita CPF, RG ou documento de identidade/passaporte internacional, com no máximo 14 caracteres (ex: CPF formatado 000.000.000-00)',
    example: '123.456.789-09',
  })
  @IsOptional()
  @MaxLength(14, {
    message: 'documento deve ter no máximo 14 caracteres',
  })
  document?: string;
}
