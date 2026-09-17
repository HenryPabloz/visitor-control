import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

// Regex do e-mail: texto@texto.texto, sem espaços e sem "@"/"." repetidos
// direto um atrás do outro (ex: recusa "a@@b.com" ou "a@b..com").
const REGEX_EMAIL = /^[^\s@.]+(\.[^\s@.]+)*@[^\s@.]+(\.[^\s@.]+)*\.[a-zA-Z]{2,}$/;

export class LoginDto {
  @IsNotEmpty({ message: 'preencha todos os campos!' })
  @Matches(REGEX_EMAIL, { message: 'insira um email válido' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email!: string;

  @IsNotEmpty({ message: 'preencha todos os campos!' })
  @IsString({ message: 'a senha deve ser um texto' })
  password!: string;
}
