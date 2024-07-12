import {
  Injectable,
  InternalServerErrorException,
  NotAcceptableException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';

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

  async findAll(queryUserDto: QueryUserDto) {
    const users = await this.prismaService.user
      .findMany({
        skip: queryUserDto.pageSize * (queryUserDto.page - 1),
        take: queryUserDto.pageSize,
        orderBy: { createdAt: queryUserDto.sort },
        where: {
          deleted: false,
          disabled: queryUserDto.disabled,
          createdAt: { gte: queryUserDto.beginTime, lte: queryUserDto.endTime },
          OR: [
            {
              userName: { contains: queryUserDto.keyword, mode: 'insensitive' },
            },
            {
              profile: {
                nickName: {
                  contains: queryUserDto.keyword,
                  mode: 'insensitive',
                },
              },
            },
          ],
        },
        select: {
          id: true,
          userName: true,
          disabled: true,
          createdAt: true,
          profile: {
            select: { nickName: true, avatar: true },
          },
          roleInUser: {
            select: {
              roleId: true,
            },
          },
        },
      })
      .catch(() => {
        throw new InternalServerErrorException('Failed to find users');
      });

    return users.map((user) => {
      const profile = user.profile;
      const roles = user.roleInUser.map((role) => role.roleId);

      return {
        id: user.id,
        userName: user.userName,
        disabled: user.disabled,
        createdAt: user.createdAt,
        ...profile,
        roles,
      };
    });
  }

  async findOne(id: string) {
    const user = await this.prismaService.user
      .findUnique({
        where: { id, deleted: false },
        select: {
          id: true,
          userName: true,
          disabled: true,
          createdAt: true,
          profile: {
            select: { nickName: true, avatar: true },
          },
          roleInUser: {
            select: {
              roleId: true,
            },
          },
        },
      })
      .catch(() => {
        throw new InternalServerErrorException('Failed to find a user');
      });

    if (!user) {
      throw new NotFoundException('The user does not exist');
    }

    const profile = user.profile;
    const roles = user.roleInUser.map((role) => role.roleId);

    return {
      id: user.id,
      userName: user.userName,
      disabled: user.disabled,
      createdAt: user.createdAt,
      ...profile,
      roles,
    };
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
