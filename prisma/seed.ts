import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await prisma.permission.createMany({
    data: [
      {
        id: 1,
        name: '系统管理',
        path: 'system',
        type: 'DIRECTORY',
        icon: 'system',
      },
      {
        id: 2,
        name: '用户管理',
        pid: 1,
        path: 'user',
        icon: 'user',
        component: '/system/user/index.vue',
        cache: true,
      },
      {
        id: 3,
        name: '添加用户',
        pid: 2,
        type: 'BUTTON',
        permission: 'system:user:add',
      },
      {
        id: 4,
        name: '编辑用户',
        pid: 2,
        type: 'BUTTON',
        permission: 'system:user:edit',
      },
      {
        id: 5,
        name: '删除用户',
        pid: 2,
        type: 'BUTTON',
        permission: 'system:user:del',
      },
      {
        id: 6,
        name: '导出用户',
        pid: 2,
        type: 'BUTTON',
        permission: 'system:user:export',
      },
      {
        id: 7,
        name: '菜单管理',
        pid: 1,
        path: 'menu',
        icon: 'menu',
        component: '/system/menu/index.vue',
        cache: true,
      },
      {
        id: 8,
        name: '添加菜单',
        pid: 7,
        type: 'BUTTON',
        permission: 'system:menu:add',
      },
      {
        id: 9,
        name: '编辑菜单',
        pid: 7,
        type: 'BUTTON',
        permission: 'system:menu:edit',
      },
      {
        id: 10,
        name: '删除菜单',
        pid: 7,
        type: 'BUTTON',
        permission: 'system:menu:del',
      },
      {
        id: 11,
        name: '角色管理',
        pid: 1,
        path: 'role',
        icon: 'role',
        component: '/system/role/index.vue',
        cache: true,
      },
      {
        id: 12,
        name: '添加角色',
        pid: 11,
        type: 'BUTTON',
        permission: 'system:role:add',
      },
      {
        id: 13,
        name: '编辑角色',
        pid: 11,
        type: 'BUTTON',
        permission: 'system:role:edit',
      },
      {
        id: 14,
        name: '删除角色',
        pid: 11,
        type: 'BUTTON',
        permission: 'system:role:del',
      },
    ],
    skipDuplicates: true,
  });

  await prisma.role.create({
    data: {
      id: 1,
      name: 'sAdmin',
      description: '系统默认超级管理员',
    },
  });

  await prisma.roleInPermission.createMany({
    data: [
      {
        role_id: 1,
        permission_id: 1,
      },
      {
        role_id: 1,
        permission_id: 2,
      },
      {
        role_id: 1,
        permission_id: 3,
      },
      {
        role_id: 1,
        permission_id: 4,
      },
      {
        role_id: 1,
        permission_id: 5,
      },
      {
        role_id: 1,
        permission_id: 6,
      },
      {
        role_id: 1,
        permission_id: 7,
      },
      {
        role_id: 1,
        permission_id: 8,
      },
      {
        role_id: 1,
        permission_id: 9,
      },
      {
        role_id: 1,
        permission_id: 10,
      },
      {
        role_id: 1,
        permission_id: 11,
      },
      {
        role_id: 1,
        permission_id: 12,
      },
      {
        role_id: 1,
        permission_id: 13,
      },
      {
        role_id: 1,
        permission_id: 14,
      },
    ],
  });

  const password = await hash('w.1admin', +process.env.BCRYPT_SALT_ROUNDS);
  await prisma.user.create({
    data: {
      userName: 'sAdmin',
      password: password,
      profile: {
        create: {
          nickName: '超级管理员',
        },
      },
      role_in_user: {
        create: {
          role_id: 1,
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
