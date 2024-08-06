import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorators/permission.decorator';
import { AuthService } from '../../auth/auth.service';
import { IPayload } from '../types';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const needPermissions = this.reflector.get<string[]>(
      PERMISSION_KEY,
      context.getHandler(),
    );
    if (!needPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: IPayload = request.user;
    const userPermissions = await this.authService.findUserPermissions(
      user.userId,
    );

    const defaultPermission = this.authService.getDefaultAdminPermission();
    if (
      userPermissions.includes(defaultPermission) ||
      userPermissions.some((permission) => needPermissions.includes(permission))
    ) {
      return true;
    }

    return false;
  }
}
