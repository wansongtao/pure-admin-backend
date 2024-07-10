import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  private generateHashPassword(password: string) {
    return hash(password, +this.config.get('BCRYPT_SALT_ROUNDS') || 10);
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { userName: createUserDto.userName },
      select: { id: true },
    });
    if (user) {
      throw new NotAcceptableException('用户名已存在');
    }

    const password = this.config.get('DEFAULT_PASSWORD') || 'd.123456';
    const hashedPassword = await this.generateHashPassword(password);

    this.prisma.user
      .create({
        data: {
          userName: createUserDto.userName,
          password: hashedPassword,
          disabled: createUserDto.disabled,
          profile: {
            create: {
              nickName: createUserDto.nickName,
              avatar: createUserDto.avatar,
            },
          },
          roleInUser: createUserDto.roles && {
            createMany: {
              data: createUserDto.roles.map((roleId) => ({
                roleId,
              })),
            },
          },
        },
      })
      .catch(() => {
        throw new InternalServerErrorException('创建用户失败');
      });
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
