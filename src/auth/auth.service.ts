import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma/prisma.service';
import { mapUsuario, UsuarioPublico } from '../users/entities/usuario-publico.entity';
import { LoginDto } from './dto/login.dto';
import { Permissao } from './enum/permission.enum';
import { JwtPayload } from './interfaces/jwt-payload.interface';

export interface LoginResponse {
  accessToken: string;
  usuario: UsuarioPublico;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const usuario = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
      },
    });

    
    if (!usuario) {
      throw new UnauthorizedException('email ou senha inválidos');
    }

    if (!usuario.isActive) {
      throw new UnauthorizedException('usuário inativo, contate o administrador');
    }

    const senhaCorreta = await bcrypt.compare(loginDto.password, usuario.password);

    if (!senhaCorreta) {
      throw new UnauthorizedException('email ou senha inválidos');
    }

    const permissoes = usuario.role.permissions.map(
      (rolePermission) => rolePermission.permission.code as Permissao,
    );

    const payload: JwtPayload = {
      sub: usuario.id_user,
      email: usuario.email,
      role: usuario.role.name,
      permissoes,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      usuario: mapUsuario(usuario, permissoes),
    };
  }
}
