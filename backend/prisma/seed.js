const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
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