import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Verify this is an admin request
    const { adminPassword } = await request.json()
    
    if (!adminPassword || adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('Starting database migration...')
    
    // Test database connection
    await prisma.$connect()
    console.log('Database connected successfully')
    
    // Run a simple query to test if migration is needed
    try {
      await prisma.board.findMany({ take: 1 })
      return NextResponse.json({
        success: true,
        message: 'Database tables already exist. Migration not needed.'
      })
    } catch (error) {
      console.log('Tables do not exist, migration needed')
    }
    
    // If we get here, tables don't exist, so we need to run the migration
    // For Vercel, we'll use db push instead of migrate
    const { execSync } = require('child_process')
    
    console.log('Running prisma db push...')
    const result = execSync('npx prisma db push --force-reset', { 
      encoding: 'utf-8',
      env: { ...process.env }
    })
    
    console.log('Migration result:', result)
    
    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully',
      output: result
    })
    
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}