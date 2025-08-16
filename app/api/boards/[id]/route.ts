import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'
import { checkAdminPassword } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const board = await prisma.board.findUnique({
      where: { id },
      include: {
        lists: {
          orderBy: { position: 'asc' },
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
          }
        },
        members: true,
        labels: true
      }
    })

    if (!board) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(board)
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
    const body = await request.json()
    
    const board = await prisma.board.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        background: body.background
      },
      include: {
        lists: {
          orderBy: { position: 'asc' },
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
        },
        members: true,
        labels: true
      }
    })

    return NextResponse.json(board)
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
    
    // Check admin authentication - required for board deletion
    const adminPassword = request.headers.get('x-admin-password')
    const hasAdminSession = request.headers.get('x-admin-session') === 'true'
    
    // Require admin authentication for board deletion
    if (!hasAdminSession && !checkAdminPassword(adminPassword)) {
      return NextResponse.json(
        { error: 'Admin authentication required to delete boards' },
        { status: 403 }
      )
    }
    
    // Check if board exists before deletion
    const existingBoard = await prisma.board.findUnique({
      where: { id }
    })
    
    if (!existingBoard) {
      return NextResponse.json(
        { error: 'Board not found' },
        { status: 404 }
      )
    }
    
    await prisma.board.delete({
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