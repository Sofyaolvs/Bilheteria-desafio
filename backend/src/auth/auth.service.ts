import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { UserRole } from '../common/enums';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Auto-cadastro é permitido só para Clientes. Organizador e Portaria são
  // feitas pelo seed mesma lógica de Sympla/Eventim, onde produtor e equipe de portaria não se cadastram
  // sozinhos por um formulário público.
  async registerClient(name: string, email: string, password: string) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) {
      throw new ConflictException('Já existe uma conta com este e-mail.');
    }
    const user = await this.usersService.create(name, email, password, UserRole.CLIENT);
    return this.buildToken(user.id, user.email, user.role, user.name);
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('E-mail ou senha inválidos.');
    const valid = await this.usersService.validatePassword(user, password);
    if (!valid) throw new UnauthorizedException('E-mail ou senha inválidos.');
    return this.buildToken(user.id, user.email, user.role, user.name);
  }

  private buildToken(sub: string, email: string, role: UserRole, name: string) {
    const accessToken = this.jwtService.sign({ sub, email, role, name });
    return {
      accessToken,
      user: { id: sub, email, role, name },
    };
  }
}
