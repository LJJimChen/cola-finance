import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.appUser.findUnique({
      where: { username: dto.username },
    });
    if (existing) {
      throw new UnauthorizedException('USERNAME_TAKEN');
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.appUser.create({
      data: {
        username: dto.username,
        password: hash,
      },
    });
    const token = this.signToken(user.id);
    return { token, userId: user.id, username: user.username, kind: 'user' };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.appUser.findUnique({
      where: { username: dto.username },
    });
    if (!user) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const match = await bcrypt.compare(dto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('INVALID_CREDENTIALS');
    }
    const token = this.signToken(user.id);
    return { token, userId: user.id, username: user.username, kind: 'user' };
  }

  private signToken(userId: string) {
    return this.jwtService.sign({
      sub: userId,
      kind: 'user',
    });
  }
}
