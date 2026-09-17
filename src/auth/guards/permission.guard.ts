import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorators';
import { Permissao } from '../enum/permission.enum';
import { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

// Guard: bloqueia o acesso à rota se o usuário logado não tiver
// todas as permissões marcadas com o decorator @Permissions.
// Precisa rodar DEPOIS de um guard de autenticação (que preenche request.user).
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permissoesNecessarias = this.reflector.getAllAndOverride<Permissao[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissoesNecessarias || permissoesNecessarias.length === 0) {
      return true;
    }

    const requisicao = context.switchToHttp().getRequest();
    const usuario: UsuarioAutenticado | undefined = requisicao.user;

    if (!usuario) {
      throw new UnauthorizedException('Usuário não autenticado.');
    }

    const possuiTodasAsPermissoes = permissoesNecessarias.every((permissao) =>
      usuario.permissoes.includes(permissao),
    );

    if (!possuiTodasAsPermissoes) {
      throw new ForbiddenException('Você não tem permissão para executar esta ação.');
    }

    return true;
  }
}
