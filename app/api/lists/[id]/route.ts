import { NextRequest, NextResponse } from 'next/server'
import { prisma, handleDatabaseError } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const list = await prisma.list.update({
      where: { id },
      data: {
        title: body.title,
        position: body.position
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

    return NextResponse.json(list)
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
    await prisma.list.delete({
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