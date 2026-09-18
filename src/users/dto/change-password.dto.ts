import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ description: 'Senha atual do usuário', example: 'senhaForte123' })
  @IsNotEmpty({ message: 'informe a senha atual' })
  currentPassword: string;

  @ApiProperty({ description: 'Nova senha (mínimo 8 caracteres)', example: 'novaSenhaForte456' })
  @MinLength(8, { message: 'a nova senha deve ter no mínimo 8 caracteres' })
  newPassword: string;
}
