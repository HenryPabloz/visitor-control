import { Permissao } from '../enum/permission.enum';

// Formato do usuário já validado pelo token, disponível em "request.user"
// depois que o guard de autenticação (JWT) rodar.
export interface UsuarioAutenticado {
  id: string;
  email: string;
  role: string;
  permissoes: Permissao[];
}
