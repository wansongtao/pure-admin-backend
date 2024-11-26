import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const roleName = 'superAdmin';
  const role = await prisma.role.upsert({
    create: {
      name: roleName,
      description: '系统默认超级管理员',
    },
    update: {},
    where: {
      name: roleName,
    },
  });

  await prisma.permission.upsert({
    create: {
      name: '系统管理',
      path: 'system',
      type: 'DIRECTORY',
      icon: 'system',
      roleInPermission: {
        create: {
          roleId: role.id,
        },
      },
      children: {
        create: [
          {
            name: '用户管理',
            path: 'user',
            icon: 'user',
            component: '/system/user/UserView.vue',
            cache: true,
            roleInPermission: {
              create: {
                roleId: role.id,
              },
            },
            children: {
              create: [
                {
                  name: '添加用户',
                  type: 'BUTTON',
                  permission: 'system:user:add',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
                {
                  name: '编辑用户',
                  type: 'BUTTON',
                  permission: 'system:user:edit',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
                {
                  name: '删除用户',
                  type: 'BUTTON',
                  permission: 'system:user:del',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
                {
                  name: '导出用户',
                  type: 'BUTTON',
                  permission: 'system:user:export',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
              ],
            },
          },
          {
            name: '菜单管理',
            path: 'menu',
            icon: 'menu',
            component: '/system/menu/MenuView.vue',
            cache: true,
            roleInPermission: {
              create: {
                roleId: role.id,
              },
            },
            children: {
              create: [
                {
                  name: '添加菜单',
                  type: 'BUTTON',
                  permission: 'system:menu:add',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
                {
                  name: '编辑菜单',
                  type: 'BUTTON',
                  permission: 'system:menu:edit',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
                {
                  name: '删除菜单',
                  type: 'BUTTON',
                  permission: 'system:menu:del',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
              ],
            },
          },
          {
            name: '角色管理',
            path: 'role',
            icon: 'role',
            component: '/system/role/RoleView.vue',
            cache: true,
            roleInPermission: {
              create: {
                roleId: role.id,
              },
            },
            children: {
              create: [
                {
                  name: '添加角色',
                  type: 'BUTTON',
                  permission: 'system:role:add',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
                {
                  name: '编辑角色',
                  type: 'BUTTON',
                  permission: 'system:role:edit',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
                {
                  name: '删除角色',
                  type: 'BUTTON',
                  permission: 'system:role:del',
                  roleInPermission: {
                    create: {
                      roleId: role.id,
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    update: {},
    where: {
      name: '系统管理',
    },
  });

  const password = await hash(
    process.env.DEFAULT_ADMIN_PASSWORD,
    +process.env.BCRYPT_SALT_ROUNDS,
  );
  const defaultUserName = process.env.DEFAULT_USERNAME || 'sAdmin';

  await prisma.user.upsert({
    create: {
      userName: defaultUserName,
      password,
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
    update: {},
    where: {
      userName: defaultUserName,
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
