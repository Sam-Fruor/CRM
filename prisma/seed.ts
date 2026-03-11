import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Keep the Master Admin
  await prisma.user.upsert({
    where: { email: 'admin@eurodriver.com' },
    update: {},
    create: {
      name: 'Master Admin',
      email: 'admin@eurodriver.com',
      password: hashedPassword,
      role: 'ADMIN',
      branch: 'MASTER',
      isActive: true,
    },
  });

  // 2. Add a Sales Rep (Mehak for Branch A)
  const salesRep = await prisma.user.upsert({
    where: { email: 'mehak@eurodriver.com' },
    update: {},
    create: {
      name: 'Mehak',
      email: 'mehak@eurodriver.com',
      password: hashedPassword, // Same password for testing: admin123
      role: 'SALES',
      branch: 'BRANCH_A',
      isActive: true,
    },
  });

  console.log('✅ Users created successfully!');
  console.log(`Test Sales Login: ${salesRep.email} / admin123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });