import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../auth/decorators/permissions.decorators';
import { Permissao } from '../auth/enum/permission.enum';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permission.guard';
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
      'Insere uma nova linha na tabela "users". A senha é criptografada com bcrypt antes de salvar e NUNCA é retornada na resposta.',
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
      'Consulta a tabela "users" (com join em "roles") pelo id_user informado na URL.',
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
}
