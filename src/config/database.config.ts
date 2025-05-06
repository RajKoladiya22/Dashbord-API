import { PrismaClient } from '@prisma/client';
import { validatedEnv } from './validate-env';
import { config } from 'dotenv';
config()


export const env = process.env;

// console.log("ENV---->", env);

// Ensure DATABASE_URL is defined
if (!env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set');
  process.exit(1);
}

declare global {
  var __globalPrisma: PrismaClient | undefined;
}

export const prisma = global.__globalPrisma ?? new PrismaClient({
  log: env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
  datasources: { db: { url: env.DATABASE_URL } },
});

if (env.NODE_ENV === 'development') {
  global.__globalPrisma = prisma;
}

prisma.$connect()
  .then(() => console.log('✅ Database connected:', env.DATABASE_URL))
  .catch(err => {
    console.error('❌ Database connection failed', err);
    process.exit(1);
  });

export async function shutdownDb() {
  await prisma.$disconnect();
}

// Graceful shutdown
process.on('SIGINT', () => shutdownDb().then(() => process.exit(0)));
process.on('SIGTERM', () => shutdownDb().then(() => process.exit(0)));
