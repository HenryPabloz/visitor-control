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
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Permissions } from '../auth/decorators/permissions.decorators';
import { Permissao } from '../auth/enum/permission.enum';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';
import { CheckoutVisitDto } from './dto/checkout-visit.dto';
import { CreateVisitDto } from './dto/create-visit.dto';
import { VisitResponseDto } from './dto/visit-response.dto';
import { VisitsService } from './visits.service';

@ApiTags('Visitas')
@ApiBearerAuth('access-token')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard, JwtAuthGuard, PermissionsGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  @Permissions(Permissao.VISIT_CREATE)
  @ApiOperation({
    summary: 'Registra o check-in de uma visita',
    description:
      'Chama a procedure insert_visit, que insere uma nova linha na tabela "visits" com status ACTIVE. O campo createdBy vem do usuário autenticado (JWT), nunca do corpo da requisição. Recepcionista pode executar esta ação.',
  })
  @ApiBody({
    schema: {
      example: {
        visitorId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        host: 'João Pereira',
        notes: 'Visita agendada previamente',
      },
    },
  })
  @ApiResponse({ status: 201, type: VisitResponseDto })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos (visitorId não é um uuid, host muito curto, notes acima de 500 caracteres)',
  })
  @ApiResponse({ status: 404, description: 'Nenhum visitante encontrado com o visitorId informado' })
  @ApiResponse({ status: 409, description: 'O visitante já possui uma visita com status ACTIVE em aberto' })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISIT_CREATE' })
  create(@Body() dto: CreateVisitDto, @CurrentUser('id') userId: string): Promise<VisitResponseDto> {
    return this.visitsService.create(dto, userId);
  }

  @Patch(':id/checkout')
  @Permissions(Permissao.VISIT_CHECKOUT)
  @ApiOperation({
    summary: 'Registra o check-out de uma visita',
    description:
      'Chama a procedure checkout_visit, que atualiza a linha na tabela "visits" pra status CLOSED, preenchendo checkoutAt e checkoutBy. O campo checkoutBy vem do usuário autenticado (JWT). Recepcionista pode executar esta ação.',
  })
  @ApiParam({ name: 'id', example: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890' })
  @ApiBody({
    schema: {
      example: {
        notes: 'Visitante saiu acompanhado',
      },
    },
  })
  @ApiResponse({ status: 200, type: VisitResponseDto })
  @ApiResponse({ status: 404, description: 'Nenhuma visita encontrada com esse id' })
  @ApiResponse({ status: 409, description: 'A visita já está com status CLOSED (checkout duplicado)' })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISIT_CHECKOUT' })
  checkout(
    @Param('id') id: string,
    @Body() dto: CheckoutVisitDto,
    @CurrentUser('id') userId: string,
  ): Promise<VisitResponseDto> {
    return this.visitsService.checkout(id, dto, userId);
  }

  @Get('active')
  @Permissions(Permissao.VISIT_VIEW)
  @ApiOperation({
    summary: 'Lista as visitas ativas',
    description: 'Consulta a tabela "visits" filtrando status=ACTIVE, com o visitante embutido, ordenado por checkinAt desc. Recepcionista pode executar esta ação.',
  })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de visitas ativas' })
  @ApiResponse({ status: 400, description: 'skip negativo ou take menor/igual a zero' })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISIT_VIEW' })
  getActiveVisits(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.visitsService.getActiveVisits(skip, take);
  }

  @Get(':id')
  @Permissions(Permissao.VISIT_VIEW)
  @ApiOperation({
    summary: 'Busca uma visita pelo id',
    description: 'Consulta a tabela "visits" (com o visitante embutido, via join) pelo id_visit da URL. Recepcionista pode executar esta ação.',
  })
  @ApiParam({ name: 'id', description: 'id_visit (uuid)', example: 'f1e2d3c4-b5a6-7890-abcd-ef1234567890' })
  @ApiResponse({ status: 200, type: VisitResponseDto })
  @ApiResponse({ status: 404, description: 'Nenhuma visita encontrada com esse id' })
  @ApiResponse({ status: 401, description: 'Token de acesso ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão VISIT_VIEW' })
  findById(@Param('id') id: string): Promise<VisitResponseDto> {
    return this.visitsService.findById(id);
  }
}
