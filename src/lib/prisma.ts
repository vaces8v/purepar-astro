import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'path';
import { fileURLToPath } from 'url';

declare global {
  var prisma: PrismaClient | undefined;
}

const createPrismaClient = () => {
  let dbUrl = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  // Fix relative path for production build (not for absolute paths like /data/db.sqlite)
  if (dbUrl.startsWith('file:./')) {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const dbPath = path.resolve(__dirname, '../../..', dbUrl.replace('file:./', ''));
    dbUrl = `file:${dbPath}`;
  }
  const adapter = new PrismaLibSql({ url: dbUrl });
  return new PrismaClient({ adapter });
};

export const prisma = globalThis.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}
