import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;

// Prisma 7 requires the explicit adapter
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// We use this pattern in Next.js to prevent multiple active database 
// connections during hot-reloading in development.
export const prisma = globalForPrisma.prisma || new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
