import { ApiProperty } from '@nestjs/swagger';

// Formato do usuário devolvido pela API — nunca inclui a senha.
export class UserResponseDto {
  @ApiProperty({ example: 'b3f1c2a0-1e2d-4b3a-9c1e-0a1b2c3d4e5f' })
  id: string;

  @ApiProperty({ example: 'recepcao@empresa.com' })
  email: string;

  @ApiProperty({ example: 'Maria da Silva' })
  fullName: string;

  @ApiProperty({ example: 'RECEPTIONIST' })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2026-09-17T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-17T12:00:00.000Z' })
  updatedAt: Date;
}
