import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Test database connection and schema status
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Check if tables exist by trying to count boards
    try {
      const boardCount = await prisma.board.count()
      const listCount = await prisma.list.count()
      const cardCount = await prisma.card.count()
      
      return NextResponse.json({
        success: true,
        message: 'Database is properly configured and accessible',
        stats: {
          boards: boardCount,
          lists: listCount,
          cards: cardCount
        }
      })
    } catch (error) {
      return NextResponse.json(
        { 
          error: 'Database tables not found',
          details: 'The database schema has not been created yet. This should be handled during the build process.',
          message: 'If you see this error, the database migration during build failed. Check your Vercel build logs.'
        },
        { status: 503 }
      )
    }
    
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// Keep POST for backward compatibility but redirect to proper setup
export async function POST(request: NextRequest) {
  try {
    const { adminPassword } = await request.json()
    
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      message: 'Database migration is now handled during build time. Check the database status with GET /api/setup/migration',
      suggestion: 'The database schema should be automatically created during Vercel deployment. If tables are missing, redeploy your application.'
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
