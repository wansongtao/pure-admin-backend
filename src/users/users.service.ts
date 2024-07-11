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
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private generateHashPassword(password: string) {
    return hash(password, +this.configService.get('BCRYPT_SALT_ROUNDS') || 10);
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prismaService.user.findUnique({
      where: { userName: createUserDto.userName },
      select: { id: true },
    });
    if (user) {
      throw new NotAcceptableException('The user already exists');
    }

    const password = this.configService.get('DEFAULT_PASSWORD') || 'd.123456';
    const hashedPassword = await this.generateHashPassword(password);

    this.prismaService.user
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
        throw new InternalServerErrorException('Failed to create a user');
      });
  }

  findAll() {
    return this.prismaService.user.findMany({
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
    return this.prismaService.user.findUnique({ where: { id } });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    console.log(updateUserDto);

    return null;
    // if (updateUserDto.password) {
    //   updateUserDto.password = await hash(
    //     updateUserDto.password,
    //     +this.configService.get<string>('BCRYPT_SALT_ROUNDS'),
    //   );
    // }

    // return this.prismaService.user.update({ where: { id }, data: updateUserDto });
  }

  remove(id: string) {
    return this.prismaService.user.update({
      where: { id },
      data: { deleted: true },
    });
  }

  async validateUser(userName: string) {
    return this.prismaService.user.findFirst({
      where: {
        userName,
        deleted: false,
        disabled: false,
      },
      select: { id: true, userName: true, password: true },
    });
  }
}
