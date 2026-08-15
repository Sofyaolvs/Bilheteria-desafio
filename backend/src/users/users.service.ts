import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UserRole } from '../common/enums';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepo: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepo.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id: string) {
    return this.usersRepo.findOne({ where: { id } });
  }

  async create(name: string, email: string, password: string, role: UserRole) {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.usersRepo.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role,
    });
    return this.usersRepo.save(user);
  }

  async validatePassword(user: User, password: string) {
    return bcrypt.compare(password, user.passwordHash);
  }
}
