import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // Prevent multiple instances of Prisma Client in development
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: ['warn', 'error'],
    });
  }
  prisma = global.__db;
}

export default prisma;
