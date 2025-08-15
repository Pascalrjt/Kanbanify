import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'
import { CreateCardRequest } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('listId')
    const boardId = searchParams.get('boardId')

    let whereClause = {}
    if (listId) {
      whereClause = { listId }
    } else if (boardId) {
      whereClause = { list: { boardId } }
    }

    const cards = await prisma.card.findMany({
      where: whereClause,
      include: {
        assignees: {
          include: { teamMember: true }
        },
        labels: {
          include: { label: true }
        },
        checklist: {
          orderBy: { position: 'asc' }
        },
        list: true
      },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json(cards)
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateCardRequest = await request.json()
    
    if (!body.title || !body.listId) {
      return NextResponse.json(
        { error: 'Card title and list ID are required' },
        { status: 400 }
      )
    }

    // Get the highest position in the list
    const lastCard = await prisma.card.findFirst({
      where: { listId: body.listId },
      orderBy: { position: 'desc' }
    })

    const card = await prisma.card.create({
      data: {
        title: body.title,
        description: body.description,
        listId: body.listId,
        priority: body.priority || 'medium',
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        position: (lastCard?.position || 0) + 1000
      },
      include: {
        assignees: {
          include: { teamMember: true }
        },
        labels: {
          include: { label: true }
        },
        checklist: {
          orderBy: { position: 'asc' }
        },
        list: true
      }
    })

    return NextResponse.json(card, { status: 201 })
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}