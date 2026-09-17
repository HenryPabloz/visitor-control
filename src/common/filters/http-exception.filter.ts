import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RespostaDeErro {
  statusCode: number;
  message: string[];
  error: string;
  timestamp: string;
  path: string;
}

// Filtro global: padroniza toda resposta de erro HTTP no mesmo formato.
// Sem isso, cada tipo de erro (validação do DTO, UnauthorizedException, etc.)
// vinha com um formato de corpo diferente, dificultando o tratamento no front-end.
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const respostaOriginal = exception.getResponse();

    const corpoDeErro: RespostaDeErro = {
      statusCode: status,
      message: this.extrairMensagens(respostaOriginal),
      error: HttpStatus[status] ?? 'Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(corpoDeErro);
  }

  // O ValidationPipe (class-validator) manda "message" como array de strings.
  // Exceções lançadas manualmente (ex: throw new UnauthorizedException('texto'))
  // mandam como string única. Aqui a gente sempre transforma em array.
  private extrairMensagens(respostaOriginal: string | object): string[] {
    if (typeof respostaOriginal === 'string') {
      return [respostaOriginal];
    }

    const mensagem = (respostaOriginal as { message?: string | string[] }).message;

    if (Array.isArray(mensagem)) {
      return mensagem;
    }

    if (typeof mensagem === 'string') {
      return [mensagem];
    }

    return ['Erro inesperado'];
  }
}
