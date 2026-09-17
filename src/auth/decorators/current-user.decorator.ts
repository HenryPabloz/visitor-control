import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

// Decorator: extrai o usuário logado (colocado em request.user pelo JwtAuthGuard)
// direto como parâmetro do controller. Uso: @CurrentUser() usuario: UsuarioAutenticado
// ou @CurrentUser('id') userId: string, pra pegar só um campo específico.
export const CurrentUser = createParamDecorator(
  (campo: keyof UsuarioAutenticado | undefined, ctx: ExecutionContext) => {
    const requisicao = ctx.switchToHttp().getRequest();
    const usuario: UsuarioAutenticado = requisicao.user;

    if (campo) {
      return usuario[campo];
    }

    return usuario;
  },
);
