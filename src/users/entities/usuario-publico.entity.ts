import { Permissao } from '../../auth/enum/permission.enum';

// Formato do usuário que pode ser exposto para o front-end:
// nunca inclui a senha nem qualquer outro dado sensível.
export interface UsuarioPublico {
  id: string;
  email: string;
  fullName: string;
  role: string;
  permissoes: Permissao[];
}

// Tipo mínimo de entrada aceito pelo mapUsuario: só os campos que
// realmente usamos, assim a função funciona com o retorno do Prisma
// mesmo que ele tenha outros campos (ex: senha) misturados.
interface UsuarioComRole {
  id_user: string;
  email: string;
  fullName: string;
  role: { name: string };
}

// Converte o usuário vindo do banco (com senha e outros dados internos)
// para o formato seguro que pode ser devolvido nas respostas da API.
export function mapUsuario(
  usuario: UsuarioComRole,
  permissoes: Permissao[],
): UsuarioPublico {
  return {
    id: usuario.id_user,
    email: usuario.email,
    fullName: usuario.fullName,
    role: usuario.role.name,
    permissoes,
  };
}
