import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { userName: 'sAdmin' },
    update: {},
    create: {
      userName: 'sAdmin',
      password: 's.admin.1',
      profile: {
        create: {
          nickName: 'Super Admin',
          email: '18101837209@163.com',
          phone: '18101837209',
          avatar:
            'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
          birthday: new Date('1998-05-04'),
          description: '千山鸟飞绝，万径人踪灭。',
        },
      },
    },
    include: {
      profile: true,
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
