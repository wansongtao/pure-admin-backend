import type { Permission } from '@prisma/client';

export interface IUserPermission {
  user_name: string;
  nick_name?: string;
  avatar?: string;
  role_names?: string;
  id: number;
  pid: number;
  name: string;
  path: string;
  permission: string;
  type: Permission['type'];
  component: string;
  cache: boolean;
  hidden: boolean;
  icon: string;
  redirect: string;
  props: boolean;
  sort: number;
}
