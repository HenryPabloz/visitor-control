import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Matches, MinLength } from 'class-validator';

// Telefone sem máscara: só números, com DDD (10 ou 11 dígitos).
const REGEX_PHONE = /^\d{10,11}$/;

export class CreateVisitorDto {
  @ApiProperty({ description: 'Nome completo do visitante', example: 'Maria da Silva' })
  @IsNotEmpty({ message: 'preencha o nome completo' })
  @MinLength(3, { message: 'o nome completo deve ter no mínimo 3 caracteres' })
  fullName: string;

  @ApiPropertyOptional({ description: 'E-mail do visitante', example: 'maria.silva@example.com' })
  @IsOptional()
  @IsEmail({}, { message: 'insira um email válido' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Telefone do visitante, apenas números com DDD (10 ou 11 dígitos)',
    example: '11987654321',
  })
  @IsOptional()
  @Matches(REGEX_PHONE, { message: 'telefone inválido, use apenas números com DDD' })
  phone?: string;

  @ApiPropertyOptional({ description: 'Empresa que o visitante representa', example: 'Acme Ltda' })
  @IsOptional()
  company?: string;

  @ApiProperty({ description: 'Motivo da visita', example: 'Reunião com o time comercial' })
  @IsNotEmpty({ message: 'preencha o motivo da visita' })
  @MinLength(5, { message: 'o motivo da visita deve ter no mínimo 5 caracteres' })
  purpose: string;

  @ApiPropertyOptional({ description: 'Documento de identificação do visitante', example: 'RG 12.345.678-9' })
  @IsOptional()
  document?: string;
}
