import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { Pool } from 'pg';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

const pool = new Pool({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminEmail = 'admin@example.com';
  const adminPassword = 'Admin123!';

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await argon2.hash(adminPassword);

    const admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: Role.ADMIN,
        isActive: true,
      },
    });

    console.log('✅ Admin user created:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ID: ${admin.id}`);
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // Create test regular user
  const userEmail = 'user@example.com';
  const userPassword = 'User123!';

  const existingUser = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!existingUser) {
    const hashedPassword = await argon2.hash(userPassword);

    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: Role.USER,
        isActive: true,
      },
    });

    console.log('✅ Test user created:');
    console.log(`   Email: ${userEmail}`);
    console.log(`   Password: ${userPassword}`);
    console.log(`   ID: ${user.id}`);
  } else {
    console.log('ℹ️  Test user already exists');
  }

  // Create sample feature flags
  const featureFlags = [
    {
      key: 'enable_email_notifications',
      enabled: true,
      description: 'Enable email notifications for users',
    },
    {
      key: 'enable_websocket',
      enabled: true,
      description: 'Enable WebSocket real-time features',
    },
    {
      key: 'enable_file_upload',
      enabled: true,
      description: 'Enable file upload functionality',
    },
    {
      key: 'maintenance_mode',
      enabled: false,
      description: 'Put application in maintenance mode',
    },
  ];

  for (const flag of featureFlags) {
    const existing = await prisma.featureFlag.findUnique({
      where: { key: flag.key },
    });

    if (!existing) {
      await prisma.featureFlag.create({ data: flag });
      console.log(`✅ Feature flag created: ${flag.key}`);
    }
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
