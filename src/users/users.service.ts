import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
// import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    console.log(createUserDto);
    return null;

    // const password = this.config.get('DEFAULT_PASSWORD') || 'd.123456';
    // const hashedPassword = await hash(
    //   password,
    //   +this.config.get('BCRYPT_SALT_ROUNDS') || 10,
    // );

    // return this.prisma.user.create({
    //   data: {
    //     userName: createUserDto.userName,
    //     password: hashedPassword,
    //     disabled: createUserDto.disabled,
    //     profile: {
    //       create: {
    //         nickName: createUserDto.nickName,
    //         avatar: createUserDto.avatar,
    //       },
    //     },
    //   },
    // });
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
    console.log(updateUserDto);

    return null;
    // if (updateUserDto.password) {
    //   updateUserDto.password = await hash(
    //     updateUserDto.password,
    //     +this.config.get<string>('BCRYPT_SALT_ROUNDS'),
    //   );
    // }

    // return this.prisma.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: string) {
    return this.prisma.user.update({ where: { id }, data: { deleted: true } });
  }
}
