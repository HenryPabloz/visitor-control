import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../database/prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { RoleEnum } from './enum/role.enum';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    const usuarioExistente = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (usuarioExistente) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail');
    }

    // Se nenhuma role for informada, o padrão é recepcionista,
    // pois é o papel mais comum de ser criado no dia a dia.
    let nomeDaRole = RoleEnum.RECEPTIONIST;
    if (dto.role) {
      nomeDaRole = dto.role;
    }

    const role = await this.prisma.role.findUnique({
      where: { name: nomeDaRole },
    });

    if (!role) {
      throw new BadRequestException(`A role "${nomeDaRole}" não está cadastrada no sistema`);
    }

    const senhaCriptografada = await bcrypt.hash(dto.password, 10);

    const usuarioCriado = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: senhaCriptografada,
        fullName: dto.fullName,
        fk_roleId: role.id_role,
      },
      include: { role: true },
    });

    return this.mapParaResposta(usuarioCriado);
  }

  async findById(userId: string): Promise<UserResponseDto> {
    const usuarioEncontrado = await this.prisma.user.findUnique({
      where: { id_user: userId },
      include: { role: true },
    });

    if (!usuarioEncontrado) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return this.mapParaResposta(usuarioEncontrado);
  }

  async findAll(
    skip: number,
    take: number,
  ): Promise<{ data: UserResponseDto[]; total: number; skip: number; take: number }> {
    if (skip < 0 || take <= 0) {
      throw new BadRequestException('skip deve ser maior ou igual a 0 e take deve ser maior que 0');
    }

    const [usuarios, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { role: true },
      }),
      this.prisma.user.count(),
    ]);

    const data = usuarios.map((usuario) => this.mapParaResposta(usuario));

    return { data, total, skip, take };
  }

  // Uso interno (fluxo de login): retorna o usuário COM a senha, ou null.
  // Não lança NotFoundException aqui — por segurança, quem chamar decide
  // o que fazer, sem revelar se o e-mail existe ou não.
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async delete(userId: string): Promise<void> {
    const usuario = await this.prisma.user.findUnique({ where: { id_user: userId } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    try {
      await this.prisma.user.delete({ where: { id_user: userId } });
    } catch (erro) {
      if (this.isErroDeChaveEstrangeira(erro)) {
        throw new ConflictException(
          'Não é possível excluir um usuário que já registrou o check-in de alguma visita',
        );
      }

      throw erro;
    }
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const usuario = await this.prisma.user.findUnique({ where: { id_user: userId } });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const senhaAtualCorreta = await bcrypt.compare(dto.currentPassword, usuario.password);

    if (!senhaAtualCorreta) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const novaSenhaIgualAtual = await bcrypt.compare(dto.newPassword, usuario.password);

    if (novaSenhaIgualAtual) {
      throw new BadRequestException('A nova senha não pode ser igual à senha atual');
    }

    const senhaCriptografada = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id_user: userId },
      data: { password: senhaCriptografada },
    });
  }

  // Detecta violação de chave estrangeira do Postgres (ex: usuário que criou visitas).
  private isErroDeChaveEstrangeira(erro: unknown): boolean {
    return typeof erro === 'object' && erro !== null && 'code' in erro && erro.code === 'P2003';
  }

  private mapParaResposta(usuario: {
    id_user: string;
    email: string;
    fullName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    role: { name: string };
  }): UserResponseDto {
    return {
      id: usuario.id_user,
      email: usuario.email,
      fullName: usuario.fullName,
      role: usuario.role.name,
      isActive: usuario.isActive,
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt,
    };
  }
}
