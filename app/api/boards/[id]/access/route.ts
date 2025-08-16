import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: boardId } = await params
    const { accessCode } = await request.json()
    
    if (!accessCode) {
      return NextResponse.json(
        { error: 'Access code is required' },
        { status: 400 }
      )
    }
    
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      select: { accessCode: true }
    })
    
    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    
    if (board.accessCode === accessCode) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'Invalid access code' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Board access validation error:', error)
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}