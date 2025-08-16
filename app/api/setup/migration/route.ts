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
      console.log('Tables do not exist, creating schema...')
    }
    
    // Create the database schema using individual SQL statements
    console.log('Creating database schema...')
    
    const sqlStatements = [
      // Create Board table
      `CREATE TABLE IF NOT EXISTS "Board" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "background" TEXT NOT NULL DEFAULT '#0079bf',
          "accessCode" TEXT,
          "isPublic" BOOLEAN NOT NULL DEFAULT false,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create TeamMember table
      `CREATE TABLE IF NOT EXISTS "TeamMember" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "color" TEXT NOT NULL,
          "boardId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create List table
      `CREATE TABLE IF NOT EXISTS "List" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "position" INTEGER NOT NULL,
          "color" TEXT DEFAULT '#f1f5f9',
          "boardId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "List_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create Card table
      `CREATE TABLE IF NOT EXISTS "Card" (
          "id" TEXT NOT NULL,
          "title" TEXT NOT NULL,
          "description" TEXT,
          "position" INTEGER NOT NULL,
          "dueDate" TIMESTAMP(3),
          "priority" TEXT DEFAULT 'medium',
          "status" TEXT DEFAULT 'active',
          "listId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create CardAssignment table
      `CREATE TABLE IF NOT EXISTS "CardAssignment" (
          "cardId" TEXT NOT NULL,
          "teamMemberId" TEXT NOT NULL,
          "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "CardAssignment_pkey" PRIMARY KEY ("cardId","teamMemberId")
      )`,
      
      // Create Label table
      `CREATE TABLE IF NOT EXISTS "Label" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "color" TEXT NOT NULL,
          "boardId" TEXT NOT NULL,
          CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create CardLabel table
      `CREATE TABLE IF NOT EXISTS "CardLabel" (
          "cardId" TEXT NOT NULL,
          "labelId" TEXT NOT NULL,
          CONSTRAINT "CardLabel_pkey" PRIMARY KEY ("cardId","labelId")
      )`,
      
      // Create ChecklistItem table
      `CREATE TABLE IF NOT EXISTS "ChecklistItem" (
          "id" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "completed" BOOLEAN NOT NULL DEFAULT false,
          "cardId" TEXT NOT NULL,
          "position" INTEGER NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ChecklistItem_pkey" PRIMARY KEY ("id")
      )`,
      
      // Create BoardAccess table
      `CREATE TABLE IF NOT EXISTS "BoardAccess" (
          "id" TEXT NOT NULL,
          "boardId" TEXT NOT NULL,
          "userEmail" TEXT NOT NULL,
          "accessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BoardAccess_pkey" PRIMARY KEY ("id")
      )`
    ]
    
    // Execute each statement individually
    for (let i = 0; i < sqlStatements.length; i++) {
      console.log(`Executing statement ${i + 1}/${sqlStatements.length}`)
      await prisma.$executeRawUnsafe(sqlStatements[i])
    }
    
    console.log('Creating indexes...')
    
    // Create indexes (ignore if they already exist)
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "Board_accessCode_key" ON "Board"("accessCode")`)
    } catch (e) {
      console.log('Index Board_accessCode_key might already exist')
    }
    
    try {
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "BoardAccess_boardId_userEmail_key" ON "BoardAccess"("boardId", "userEmail")`)
    } catch (e) {
      console.log('Index BoardAccess_boardId_userEmail_key might already exist')
    }
    
    console.log('Adding foreign key constraints...')
    
    // Add foreign keys (ignore if they already exist)
    const foreignKeys = [
      `ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "List" ADD CONSTRAINT "List_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Card" ADD CONSTRAINT "Card_listId_fkey" FOREIGN KEY ("listId") REFERENCES "List"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "CardAssignment" ADD CONSTRAINT "CardAssignment_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "CardAssignment" ADD CONSTRAINT "CardAssignment_teamMemberId_fkey" FOREIGN KEY ("teamMemberId") REFERENCES "TeamMember"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "Label" ADD CONSTRAINT "Label_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "CardLabel" ADD CONSTRAINT "CardLabel_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "CardLabel" ADD CONSTRAINT "CardLabel_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "ChecklistItem" ADD CONSTRAINT "ChecklistItem_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE`,
      `ALTER TABLE "BoardAccess" ADD CONSTRAINT "BoardAccess_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    ]
    
    for (const fk of foreignKeys) {
      try {
        await prisma.$executeRawUnsafe(fk)
      } catch (e) {
        console.log('Foreign key constraint might already exist:', e.message)
      }
    }
    
    console.log('Database schema created successfully')
    
    // Test that tables were created
    const boardCount = await prisma.board.count()
    console.log('Board table accessible, count:', boardCount)
    
    return NextResponse.json({
      success: true,
      message: 'Database schema created successfully',
      boardCount
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