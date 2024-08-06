import type { Permission, Profile } from '@prisma/client';

export interface IPayload {
  userId: string;
}

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

export interface IProfile {
  user_name: string;
  role_names?: string;
  nick_name?: string;
  avatar?: string;
  birthday?: Profile['birthday'];
  email?: string;
  gender: Profile['gender'];
  phone?: string;
  description?: string;
}
