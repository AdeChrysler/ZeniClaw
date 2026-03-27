import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Append connection pool params to DATABASE_URL if not already set.
// Prevents Prisma pool exhaustion from blocking health checks.
function buildDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connection_limit")) {
      parsed.searchParams.set("connection_limit", "5");
    }
    if (!parsed.searchParams.has("pool_timeout")) {
      parsed.searchParams.set("pool_timeout", "4");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const prismaOptions = {
  log: ["error"] as ["error"],
  ...(buildDatabaseUrl() ? { datasources: { db: { url: buildDatabaseUrl() } } } : {}),
};

globalForPrisma.prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);
export const prisma = globalForPrisma.prisma;
