import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'
import { CreateBoardRequest } from '@/types'

export async function GET() {
  try {
    const boards = await prisma.board.findMany({
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
      },
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(boards)
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
    const body: CreateBoardRequest = await request.json()
    
    if (!body.title) {
      return NextResponse.json(
        { error: 'Board title is required' },
        { status: 400 }
      )
    }

    // Create board with default lists
    const board = await prisma.board.create({
      data: {
        title: body.title,
        description: body.description,
        background: body.background || '#0079bf',
        lists: {
          create: [
            { title: 'To Do', position: 1000, color: '#fef2f2' },
            { title: 'In Progress', position: 2000, color: '#fef3e2' },
            { title: 'Review', position: 3000, color: '#f0f9ff' },
            { title: 'Done', position: 4000, color: '#f0fdf4' }
          ]
        }
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

    return NextResponse.json(board, { status: 201 })
  } catch (error) {
    const errorMessage = handleDatabaseError(error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}