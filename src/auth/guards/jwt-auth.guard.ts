import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Guard de autenticação: dispara a JwtStrategy para validar o token.
// Deve rodar ANTES do PermissionsGuard, pois é ele quem preenche request.user.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
