import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
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
      'Chama a procedure create_visitor, que insere uma nova linha na tabela "visitors" e gera o id.',
  })
  @ApiBody({
    schema: {
      example: {
        fullName: 'Maria da Silva',
        email: 'maria.silva@example.com',
        phone: '11987654321',
        company: 'Acme Ltda',
        purpose: 'Reunião com o time comercial',
        document: 'RG 12.345.678-9',
      },
    },
  })
  @ApiResponse({ status: 201, type: VisitorResponseDto, description: 'Visitante criado com sucesso' })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos (nome muito curto, telefone fora do formato, motivo da visita muito curto, e-mail mal formatado)',
  })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISITOR_CREATE' })
  create(@Body() dto: CreateVisitorDto): Promise<VisitorResponseDto> {
    return this.visitorsService.create(dto);
  }

  @Get(':id')
  @Permissions(Permissao.VISITOR_VIEW)
  @ApiOperation({
    summary: 'Busca um visitante pelo id',
    description:
      'Consulta a tabela "visitors" pelo id_visitor da URL. Nunca retorna cpf/document.',
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
    description: 'Consulta a tabela "visitors" com skip/take, ordenado por createdAt desc.',
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
}
