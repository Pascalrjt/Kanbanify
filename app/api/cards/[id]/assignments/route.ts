import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { teamMemberId } = body
    
    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.cardAssignment.findUnique({
      where: {
        cardId_teamMemberId: {
          cardId: id,
          teamMemberId: teamMemberId
        }
      }
    })

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Team member is already assigned to this card' },
        { status: 400 }
      )
    }

    const assignment = await prisma.cardAssignment.create({
      data: {
        cardId: id,
        teamMemberId: teamMemberId
      },
      include: {
        teamMember: true,
        card: {
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

    return NextResponse.json(assignment, { status: 201 })
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
    const { searchParams } = new URL(request.url)
    const teamMemberId = searchParams.get('teamMemberId')
    
    if (!teamMemberId) {
      return NextResponse.json(
        { error: 'Team member ID is required' },
        { status: 400 }
      )
    }

    await prisma.cardAssignment.delete({
      where: {
        cardId_teamMemberId: {
          cardId: id,
          teamMemberId: teamMemberId
        }
      }
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