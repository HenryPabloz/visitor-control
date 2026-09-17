import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Ativa as validações dos DTOs (@IsEmail, @IsNotEmpty etc) em todas as rotas
  // e remove do corpo da requisição qualquer campo que não esteja no DTO.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  configurarSwagger(app);

  // Padroniza o formato de todas as respostas de erro da API.
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}

function configurarSwagger(app: Awaited<ReturnType<typeof NestFactory.create>>) {
  const config = new DocumentBuilder()
    .setTitle('API Controle de visitantes')
    .setDescription(
      'API de controle de visitantes: cadastro de usuários (recepcionistas e administradores), cadastro de visitantes, registro de check-in/check-out de visitas e controle de acesso por roles e permissions (RBAC).',
    )
    .setVersion('1.0')
    // Botão "Authorize" para colar o token JWT recebido no /auth/login.
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    // Botão "Authorize" para a chave de aplicação enviada no header x-api-key.
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

bootstrap();
