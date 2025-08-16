import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/boards/route'

// Mock the database
jest.mock('@/lib/db', () => ({
  prisma: {
    board: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  },
  handleDatabaseError: jest.fn((error) => error.message),
}))

// Mock auth
jest.mock('@/lib/auth', () => ({
  checkAdminPassword: jest.fn(),
}))

const mockPrisma = require('@/lib/db').prisma
const mockCheckAdminPassword = require('@/lib/auth').checkAdminPassword

describe('/api/boards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/boards', () => {
    it('should return all boards with nested data', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          title: 'Test Board',
          description: 'Test Description',
          background: '#0079bf',
          lists: [
            {
              id: 'list-1',
              title: 'To Do',
              position: 1000,
              cards: [
                {
                  id: 'card-1',
                  title: 'Test Card',
                  position: 1000,
                  assignees: [],
                  labels: [],
                  checklist: [],
                },
              ],
            },
          ],
          members: [],
          labels: [],
        },
      ]

      mockPrisma.board.findMany.mockResolvedValue(mockBoards)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockBoards)
      expect(mockPrisma.board.findMany).toHaveBeenCalledWith({
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
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database connection failed')
      mockPrisma.board.findMany.mockRejectedValue(mockError)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database connection failed')
    })
  })

  describe('POST /api/boards', () => {
    it('should create board with admin session', async () => {
      const mockBoard = {
        id: 'board-1',
        title: 'New Board',
        description: 'New Description',
        background: '#0079bf',
        lists: [],
        members: [],
        labels: [],
      }

      mockPrisma.board.create.mockResolvedValue(mockBoard)

      const request = new NextRequest('http://localhost/api/boards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-session': 'true',
        },
        body: JSON.stringify({
          title: 'New Board',
          description: 'New Description',
          background: '#0079bf',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockBoard)
    })

    it('should create board with valid admin password', async () => {
      const mockBoard = {
        id: 'board-1',
        title: 'New Board',
        lists: [],
        members: [],
        labels: [],
      }

      mockPrisma.board.create.mockResolvedValue(mockBoard)
      mockCheckAdminPassword.mockReturnValue(true)

      const request = new NextRequest('http://localhost/api/boards', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Board',
          adminPassword: 'correct-password',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockBoard)
      expect(mockCheckAdminPassword).toHaveBeenCalledWith('correct-password')
    })

    it('should reject without admin authentication', async () => {
      mockCheckAdminPassword.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/boards', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Board',
          adminPassword: 'wrong-password',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('Admin authentication required')
    })

    it('should reject without title', async () => {
      const request = new NextRequest('http://localhost/api/boards', {
        method: 'POST',
        headers: {
          'x-admin-session': 'true',
        },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Board title is required')
    })

    it('should create board with default lists', async () => {
      mockPrisma.board.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/boards', {
        method: 'POST',
        headers: {
          'x-admin-session': 'true',
        },
        body: JSON.stringify({
          title: 'New Board',
        }),
      })

      await POST(request)

      expect(mockPrisma.board.create).toHaveBeenCalledWith({
        data: {
          title: 'New Board',
          description: undefined,
          background: '#0079bf',
          lists: {
            create: [
              { title: 'To Do', position: 1000, color: '#fef2f2' },
              { title: 'In Progress', position: 2000, color: '#fef3e2' },
              { title: 'Review', position: 3000, color: '#f0f9ff' },
              { title: 'Done', position: 4000, color: '#f0fdf4' }
            ]
          }
        },
        include: expect.any(Object)
      })
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database error')
      mockPrisma.board.create.mockRejectedValue(mockError)

      const request = new NextRequest('http://localhost/api/boards', {
        method: 'POST',
        headers: {
          'x-admin-session': 'true',
        },
        body: JSON.stringify({
          title: 'New Board',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})