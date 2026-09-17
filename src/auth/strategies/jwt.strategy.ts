import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { UsuarioAutenticado } from '../interfaces/usuario-autenticado.interface';

// Strategy do Passport: extrai o token do header "Authorization: Bearer <token>",
// valida a assinatura com o JWT_SECRET e transforma o payload em UsuarioAutenticado.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const segredo = configService.get<string>('JWT_SECRET');

    if (!segredo) {
      throw new Error('JWT_SECRET não configurado no .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: segredo,
    });
  }

  // O Passport chama esse método depois de validar a assinatura do token.
  // O retorno aqui é o que vira "request.user" nas rotas protegidas.
  validate(payload: JwtPayload): UsuarioAutenticado {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token inválido.');
    }

    return {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
      permissoes: payload.permissoes,
    };
  }
}
