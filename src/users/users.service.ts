import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'nestjs-prisma';
import { hash } from 'bcrypt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const hashedPassword = await hash(
      createUserDto.password,
      +this.config.get('BCRYPT_SALT_ROUNDS'),
    );
    createUserDto.password = hashedPassword;

    return this.prisma.user.create({ data: createUserDto });
  }

  findAll() {
    return this.prisma.user.findMany({
      where: { deleted: false },
      select: {
        id: true,
        userName: true,
        disabled: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: { nickName: true, avatar: true, email: true },
        },
        roleInUser: {
          select: {
            roleId: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await hash(
        updateUserDto.password,
        +this.config.get<string>('BCRYPT_SALT_ROUNDS'),
      );
    }

    return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deleted: true } });
  }
}
