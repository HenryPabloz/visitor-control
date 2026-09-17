import { SetMetadata } from '@nestjs/common';
import { Permissao } from '../enum/permission.enum';

export const PERMISSIONS_KEY = 'permissoesNecessarias';

// Decorator: marca uma rota com as permissões exigidas para acessá-la.
// Exemplo de uso: @Permissions(Permissao.VISIT_CREATE)
export const Permissions = (...permissoes: Permissao[]) =>
  SetMetadata(PERMISSIONS_KEY, permissoes);
