import {
  Body,
  Controller,
  Delete,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
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
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RoleEnum } from './enum/role.enum';
import { UserService } from './user.service';

@ApiTags('Usuários')
@ApiBearerAuth('access-token')
@ApiSecurity('api-key')
@UseGuards(ApiKeyGuard, JwtAuthGuard, PermissionsGuard)
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @Permissions(Permissao.USER_CREATE)
  @ApiOperation({
    summary: 'Cria um novo usuário do sistema',
    description:
      'Insere uma nova linha na tabela "users". A senha é criptografada com bcrypt antes de salvar e NUNCA é retornada na resposta. Recepcionista NÃO pode executar esta ação — exige a role ADMIN.',
  })
  @ApiBody({
    type: CreateUserDto,
    examples: {
      exemplo: {
        summary: 'Novo recepcionista',
        value: {
          email: 'recepcao@empresa.com',
          password: 'senhaForte123',
          fullName: 'Maria da Silva',
          role: RoleEnum.RECEPTIONIST,
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: UserResponseDto, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 409, description: 'Já existe um usuário cadastrado com esse e-mail' })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos (e-mail mal formatado, senha com menos de 8 caracteres, nome muito curto) ou role inexistente',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente, expirado ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão USER_CREATE' })
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(dto);
  }

  @Get(':id')
  @Permissions(Permissao.USER_LIST)
  @ApiOperation({
    summary: 'Busca um usuário pelo id',
    description:
      'Consulta a tabela "users" (com join em "roles") pelo id_user informado na URL. Recepcionista NÃO pode executar esta ação — exige a role ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'id_user (uuid)',
    example: 'b3f1c2a0-1e2d-4b3a-9c1e-0a1b2c3d4e5f',
  })
  @ApiResponse({ status: 200, type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Nenhum usuário encontrado com esse id' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente, expirado ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão USER_LIST' })
  async findById(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findById(id);
  }

  @Get()
  @Permissions(Permissao.USER_LIST)
  @ApiOperation({
    summary: 'Lista todos os usuários com paginação',
    description: 'Consulta a tabela "users" (com join em "roles") com skip/take, ordenado por createdAt desc. Recepcionista NÃO pode executar esta ação — exige a role ADMIN.',
  })
  @ApiQuery({ name: 'skip', required: false, example: 0 })
  @ApiQuery({ name: 'take', required: false, example: 20 })
  @ApiResponse({ status: 200, description: 'Lista paginada de usuários' })
  @ApiResponse({ status: 400, description: 'skip negativo ou take menor/igual a zero' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente, expirado ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão USER_LIST' })
  async findAll(
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
  ) {
    return this.userService.findAll(skip, take);
  }

  @Patch('me/password')
  @Permissions(Permissao.USER_UPDATE_OWN)
  @ApiOperation({
    summary: 'Troca a própria senha',
    description:
      'Atualiza o campo "password" (com novo hash bcrypt) da linha do usuário autenticado na tabela "users". Recepcionista pode executar esta ação.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Senha atualizada com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Nova senha inválida (menos de 8 caracteres) ou igual à senha atual',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT ausente/inválido, ou senha atual informada incorretamente',
  })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão USER_UPDATE_OWN' })
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    await this.userService.changePassword(userId, dto);
    return { message: 'Senha atualizada com sucesso' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions(Permissao.USER_DELETE)
  @ApiOperation({
    summary: 'Exclui um usuário do sistema',
    description:
      'Remove a linha correspondente da tabela "users". Recepcionista NÃO pode executar esta ação — exige a role ADMIN.',
  })
  @ApiParam({
    name: 'id',
    description: 'id_user (uuid)',
    example: 'b3f1c2a0-1e2d-4b3a-9c1e-0a1b2c3d4e5f',
  })
  @ApiResponse({ status: 204, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Nenhum usuário encontrado com esse id' })
  @ApiResponse({
    status: 409,
    description: 'Usuário não pode ser excluído porque já registrou o check-in de alguma visita',
  })
  @ApiResponse({ status: 401, description: 'Token JWT ausente, expirado ou inválido' })
  @ApiResponse({ status: 403, description: 'Usuário autenticado não possui a permissão USER_DELETE' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.userService.delete(id);
  }
}
