import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Guard: exige o header "x-api-key" com a chave da aplicação cliente,
// uma camada de acesso separada do login do usuário (JWT). Sem essa chave,
// nem a rota de login é alcançada.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const requisicao = context.switchToHttp().getRequest();
    const chaveEnviada = requisicao.headers['x-api-key'];
    const chaveEsperada = this.configService.get<string>('API_KEY');

    if (!chaveEnviada || chaveEnviada !== chaveEsperada) {
      throw new UnauthorizedException('API key ausente ou inválida');
    }

    return true;
  }
}
