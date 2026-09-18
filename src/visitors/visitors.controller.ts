import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorators';
import { Permissao } from '../auth/enum/permission.enum';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';
import { CreateVisitorDto } from './dto/create-visitor.dto';
import { UpdateVisitorDto } from './dto/update-visitor.dto';
import { VisitorResponseDto } from './dto/visitor-response.dto';
import { VisitorsService } from './visitors.service';

@ApiTags('Visitantes')
@ApiBearerAuth('access-token')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard, JwtAuthGuard, PermissionsGuard)
@Controller('visitors')
export class VisitorsController {
  constructor(private readonly visitorsService: VisitorsService) {}

  @Post()
  @Permissions(Permissao.VISITOR_CREATE)
  @ApiOperation({
    summary: 'Cadastra um novo visitante',
    description:
      'Chama a procedure create_visitor, que insere uma nova linha na tabela "visitors" e gera o id. Recepcionista pode executar esta ação.',
  })
  @ApiBody({
    type: CreateVisitorDto,
    examples: {
      cpf: {
        summary: 'Visitante com CPF',
        value: {
          fullName: 'Maria da Silva',
          email: 'maria.silva@example.com',
          phone: '11987654321',
          company: 'Acme Ltda',
          purpose: 'Reunião com o time comercial',
          document: '123.456.789-09',
        },
      },
      rg: {
        summary: 'Visitante com RG',
        value: {
          fullName: 'João Pereira',
          email: 'joao.pereira@example.com',
          phone: '11912345678',
          company: 'Beta Consultoria',
          purpose: 'Entrevista de emprego',
          document: '12.345.678-9',
        },
      },
      internacional: {
        summary: 'Visitante com documento internacional',
        value: {
          fullName: 'John Smith',
          email: 'john.smith@example.com',
          phone: '11955556666',
          company: 'Globex Corp',
          purpose: 'Reunião de negócios internacional',
          document: 'X1234567',
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: VisitorResponseDto, description: 'Visitante criado com sucesso' })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos (nome muito curto, telefone com formato/tamanho errado, motivo da visita muito curto, e-mail mal formatado, documento com mais de 14 caracteres)',
  })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISITOR_CREATE' })
  @ApiResponse({ status: 409, description: 'Já existe um visitante cadastrado com esse e-mail ou documento' })
  create(@Body() dto: CreateVisitorDto): Promise<VisitorResponseDto> {
    return this.visitorsService.create(dto);
  }

  @Get(':id')
  @Permissions(Permissao.VISITOR_VIEW)
  @ApiOperation({
    summary: 'Busca um visitante pelo id',
    description:
      'Consulta a tabela "visitors" pelo id_visitor da URL. Nunca retorna cpf/document. Recepcionista pode executar esta ação.',
  })
  @ApiParam({ name: 'id', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, type: VisitorResponseDto })
  @ApiResponse({ status: 404, description: 'Nenhum visitante encontrado com esse id' })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISITOR_VIEW' })
  findById(@Param('id') id: string): Promise<VisitorResponseDto> {
    return this.visitorsService.findById(id);
  }

  @Get()
  @Permissions(Permissao.VISITOR_VIEW)
  @ApiOperation({
    summary: 'Lista visitantes com paginação',
    description: 'Consulta a tabela "visitors" com skip/take, ordenado por createdAt desc. Recepcionista pode executar esta ação.',
  })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de visitantes' })
  @ApiResponse({ status: 400, description: 'skip negativo ou take menor/igual a zero' })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISITOR_VIEW' })
  getAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.visitorsService.getAll(skip, take);
  }

  @Patch(':id')
  @Permissions(Permissao.VISITOR_UPDATE)
  @ApiOperation({
    summary: 'Atualiza dados de um visitante',
    description:
      'Atualiza parcialmente os campos fullName, email, phone, company e purpose na tabela "visitors" (cpf/document não podem ser alterados por esta rota). Recepcionista pode executar esta ação.',
  })
  @ApiParam({ name: 'id', description: 'id_visitor (uuid)', example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  @ApiBody({
    schema: {
      example: {
        phone: '11987654321',
        company: 'Nova Empresa Ltda',
      },
    },
  })
  @ApiResponse({ status: 200, type: VisitorResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos (nome muito curto, telefone com formato/tamanho errado, motivo da visita muito curto, e-mail mal formatado)',
  })
  @ApiResponse({ status: 404, description: 'Nenhum visitante encontrado com esse id' })
  @ApiResponse({ status: 409, description: 'Já existe outro visitante cadastrado com esse e-mail' })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISITOR_UPDATE' })
  update(@Param('id') id: string, @Body() dto: UpdateVisitorDto): Promise<VisitorResponseDto> {
    return this.visitorsService.update(id, dto);
  }
}
