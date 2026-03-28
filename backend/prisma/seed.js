const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // Check if admin already exists — safe to run multiple times
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@ipl.com' }
  });

  if (existing) {
    console.log('✅ Admin already exists, skipping seed.');
    return;
  }

  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@ipl.com',
      password: hashed,
      isAdmin: true
    }
  });
  console.log('✅ Admin user created!');
}

main().catch(console.error).finally(() => prisma.$disconnect());