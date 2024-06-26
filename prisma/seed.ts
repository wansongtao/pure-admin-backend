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

  const role = await prisma.role.create({
    data: {
      name: 'sAdmin',
      description: '系统默认超级管理员',
    },
  });

  await prisma.roleInPermission.createMany({
    data: [
      {
        roleId: role.id,
        permissionId: 1,
      },
      {
        roleId: role.id,
        permissionId: 2,
      },
      {
        roleId: role.id,
        permissionId: 3,
      },
      {
        roleId: role.id,
        permissionId: 4,
      },
      {
        roleId: role.id,
        permissionId: 5,
      },
      {
        roleId: role.id,
        permissionId: 6,
      },
      {
        roleId: role.id,
        permissionId: 7,
      },
      {
        roleId: role.id,
        permissionId: 8,
      },
      {
        roleId: role.id,
        permissionId: 9,
      },
      {
        roleId: role.id,
        permissionId: 10,
      },
      {
        roleId: role.id,
        permissionId: 11,
      },
      {
        roleId: role.id,
        permissionId: 12,
      },
      {
        roleId: role.id,
        permissionId: 13,
      },
      {
        roleId: role.id,
        permissionId: 14,
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
      roleInUser: {
        create: {
          roleId: role.id,
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
