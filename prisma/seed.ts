const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = 'test@example.com';
  const plainPassword = 'Password123!';
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      password: hashedPassword,
      isActive: true,
      firstName: 'Test',
      lastName: 'User',
    },
  });

  // Also seed an inactive user so you can verify the 403 path.
  const inactiveEmail = 'inactive@example.com';
  const inactiveUser = await prisma.user.upsert({
    where: { email: inactiveEmail },
    update: {},
    create: {
      email: inactiveEmail,
      password: await bcrypt.hash(plainPassword, 10),
      isActive: false,
      firstName: 'Inactive',
      lastName: 'User',
    },
  });

  console.log('Seeded users:');
  console.log(`  Active:   ${user.email} / password: ${plainPassword}`);
  console.log(`  Inactive: ${inactiveUser.email} / password: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
