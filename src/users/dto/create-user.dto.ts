import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { RoleEnum } from '../enum/role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'recepcao@empresa.com' })
  @IsEmail({}, { message: 'insira um email válido' })
  email: string;

  @ApiProperty({ example: 'senhaForte123' })
  @MinLength(8, { message: 'a senha deve ter no mínimo 8 caracteres' })
  password: string;

  @ApiProperty({ example: 'Maria da Silva' })
  @MinLength(3, { message: 'o nome completo deve ter no mínimo 3 caracteres' })
  fullName: string;

  @ApiPropertyOptional({
    enum: RoleEnum,
    example: RoleEnum.RECEPTIONIST,
    description:
      "Se não for informada, o padrão é RECEPTIONIST. Aceita minúsculas ou maiúsculas (ex: 'admin' também funciona).",
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }
    if (value.trim() === '') {
      return undefined;
    }
    return value.toUpperCase();
  })
  @IsEnum(RoleEnum, { message: 'role inválida' })
  role?: RoleEnum;
}
