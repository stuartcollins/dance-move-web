import { PrismaClient } from '@/generated/prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

async function createAdapter() {
  if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
    const { PrismaLibSql } = await import('@prisma/adapter-libsql')
    return new PrismaLibSql({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
  }

  const { PrismaBetterSqlite3 } = await import('@prisma/adapter-better-sqlite3')
  const dbPath = path.join(process.cwd(), 'dev.db')
  return new PrismaBetterSqlite3({ url: dbPath })
}

// Lazy-initialized prisma client that works with both local SQLite and Turso
let _prisma: PrismaClient | undefined = globalForPrisma.prisma

export async function getPrisma(): Promise<PrismaClient> {
  if (!_prisma) {
    const adapter = await createAdapter()
    _prisma = new PrismaClient({ adapter })
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = _prisma
    }
  }
  return _prisma
}
