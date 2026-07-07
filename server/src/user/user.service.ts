import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { RegisterDto } from 'src/auth/dto/register.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(data: RegisterDto) {
    const user = this.usersRepository.create(data);

    return this.usersRepository.save(user);
  }

  findById(id: string) {
    return this.usersRepository.findOne({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  update(id: string, data: Partial<User>) {
    return this.usersRepository.update(id, data);
  }

  delete(id: string) {
    return this.usersRepository.delete(id);
  }
}
