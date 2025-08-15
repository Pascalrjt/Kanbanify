import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.content || !body.cardId) {
      return NextResponse.json(
        { error: 'Content and cardId are required' },
        { status: 400 }
      )
    }

    // Get the current max position for this card
    const maxPosition = await prisma.checklistItem.findFirst({
      where: { cardId: body.cardId },
      orderBy: { position: 'desc' },
      select: { position: true }
    })

    const newPosition = (maxPosition?.position || 0) + 1000

    const checklistItem = await prisma.checklistItem.create({
      data: {
        content: body.content,
        completed: body.completed || false,
        cardId: body.cardId,
        position: newPosition,
      }
    })

    return NextResponse.json(checklistItem, { status: 201 })
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}