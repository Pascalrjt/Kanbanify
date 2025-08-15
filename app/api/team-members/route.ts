import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'
import { CreateTeamMemberRequest } from '@/types'

// Predefined avatar colors
const AVATAR_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef'
]

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

    const teamMembers = await prisma.teamMember.findMany({
      where: { boardId },
      include: {
        cards: {
          include: {
            card: {
              include: {
                list: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json(teamMembers)
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
    const body: CreateTeamMemberRequest = await request.json()
    
    if (!body.name || !body.boardId) {
      return NextResponse.json(
        { error: 'Name and board ID are required' },
        { status: 400 }
      )
    }

    // Generate random color if not provided
    const color = body.color || AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]

    const teamMember = await prisma.teamMember.create({
      data: {
        name: body.name.trim(),
        boardId: body.boardId,
        color
      },
      include: {
        cards: {
          include: {
            card: {
              include: {
                list: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json(teamMember, { status: 201 })
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}