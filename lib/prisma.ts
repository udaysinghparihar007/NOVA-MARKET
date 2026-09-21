// lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { requireEnv } from './env';

declare global {
  var prisma: PrismaClient | undefined;
}

const databaseUrl = requireEnv('DATABASE_URL');
const prisma =
  globalThis.prisma ||
  new PrismaClient({
    datasources: {
      db: { url: databaseUrl },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;
