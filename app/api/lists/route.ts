import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'
import { CreateListRequest } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const boardId = searchParams.get('boardId')

    if (!boardId) {
      return NextResponse.json(
        { error: 'Board ID is required' },
        { status: 400 }
      )
    }

    const lists = await prisma.list.findMany({
      where: { boardId },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: {
            assignees: {
              include: { teamMember: true }
            },
            labels: {
              include: { label: true }
            },
            checklist: {
              orderBy: { position: 'asc' }
            }
          }
        }
      },
      orderBy: { position: 'asc' }
    })

    return NextResponse.json(lists)
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
    const body: CreateListRequest = await request.json()
    
    if (!body.title || !body.boardId) {
      return NextResponse.json(
        { error: 'List title and board ID are required' },
        { status: 400 }
      )
    }

    // Get the highest position in the board
    const lastList = await prisma.list.findFirst({
      where: { boardId: body.boardId },
      orderBy: { position: 'desc' }
    })

    const list = await prisma.list.create({
      data: {
        title: body.title,
        boardId: body.boardId,
        position: body.position || (lastList?.position || 0) + 1000
      },
      include: {
        cards: {
          orderBy: { position: 'asc' },
          include: {
            assignees: {
              include: { teamMember: true }
            },
            labels: {
              include: { label: true }
            }
          }
        }
      }
    })

    return NextResponse.json(list, { status: 201 })
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}