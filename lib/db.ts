import { PrismaClient } from '@prisma/client'

// Optimize for Vercel serverless with connection pooling
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.POSTGRES_PRISMA_URL // Use pooling URL for better performance
      }
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Utility function to handle database errors
export function handleDatabaseError(error: unknown): string {
  if (error instanceof Error) {
    // Log the full error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Database error:', error)
    }
    
    // Return user-friendly error messages
    if (error.message.includes('unique constraint')) {
      return 'A record with this information already exists'
    }
    if (error.message.includes('foreign key constraint')) {
      return 'Cannot delete this item because it is referenced by other items'
    }
    if (error.message.includes('not found')) {
      return 'The requested item was not found'
    }
    
    return 'A database error occurred'
  }
  
  return 'An unknown error occurred'
}

// Utility function to safely disconnect in serverless environment
export async function disconnectDatabase() {
  if (globalForPrisma.prisma) {
    await globalForPrisma.prisma.$disconnect()
  }
}