import { Permissao } from '../enum/permission.enum';

// Formato dos dados que ficam guardados dentro do token JWT.
// "sub" é o padrão do JWT para o id do dono do token (o id_user).
export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  permissoes: Permissao[];
  iat?: number;
  exp?: number;
}
