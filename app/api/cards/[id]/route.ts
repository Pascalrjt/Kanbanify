import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'
import { UpdateCardRequest } from '@/types'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const card = await prisma.card.findUnique({
      where: { id },
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

    if (!card) {
      return NextResponse.json(
        { error: 'Card not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(card)
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UpdateCardRequest = await request.json()
    
    // Handle moving card to different list
    let updateData: any = {
      title: body.title,
      description: body.description,
      priority: body.priority,
      position: body.position
    }

    if (body.dueDate) {
      updateData.dueDate = new Date(body.dueDate)
    }

    if (body.listId) {
      updateData.listId = body.listId
      
      // If moving to a different list and no position specified, put it at the end
      if (body.position === undefined) {
        const lastCard = await prisma.card.findFirst({
          where: { listId: body.listId },
          orderBy: { position: 'desc' }
        })
        updateData.position = (lastCard?.position || 0) + 1000
      }
    }

    const card = await prisma.card.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json(card)
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.card.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}