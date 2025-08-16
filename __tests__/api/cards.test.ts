import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/cards/route'

// Mock the database
jest.mock('@/lib/db', () => ({
  prisma: {
    card: {
      findMany: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
  handleDatabaseError: jest.fn((error) => error.message),
}))

const mockPrisma = require('@/lib/db').prisma

describe('/api/cards', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/cards', () => {
    it('should return cards filtered by listId', async () => {
      const mockCards = [
        {
          id: 'card-1',
          title: 'Test Card',
          description: 'Test Description',
          position: 1000,
          priority: 'medium',
          listId: 'list-1',
          assignees: [],
          labels: [],
          checklist: [],
          list: { id: 'list-1', title: 'To Do' },
        },
      ]

      mockPrisma.card.findMany.mockResolvedValue(mockCards)

      const url = new URL('http://localhost/api/cards?listId=list-1')
      const request = new NextRequest(url)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual(mockCards)
      expect(mockPrisma.card.findMany).toHaveBeenCalledWith({
        where: { listId: 'list-1' },
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
    })

    it('should return cards filtered by boardId', async () => {
      const mockCards = [
        {
          id: 'card-1',
          title: 'Test Card',
          list: { boardId: 'board-1' },
        },
      ]

      mockPrisma.card.findMany.mockResolvedValue(mockCards)

      const url = new URL('http://localhost/api/cards?boardId=board-1')
      const request = new NextRequest(url)
      const response = await GET(request)

      expect(mockPrisma.card.findMany).toHaveBeenCalledWith({
        where: { list: { boardId: 'board-1' } },
        include: expect.any(Object),
        orderBy: { position: 'asc' }
      })
    })

    it('should return all cards when no filters', async () => {
      const mockCards = []
      mockPrisma.card.findMany.mockResolvedValue(mockCards)

      const request = new NextRequest('http://localhost/api/cards')
      await GET(request)

      expect(mockPrisma.card.findMany).toHaveBeenCalledWith({
        where: {},
        include: expect.any(Object),
        orderBy: { position: 'asc' }
      })
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database error')
      mockPrisma.card.findMany.mockRejectedValue(mockError)

      const request = new NextRequest('http://localhost/api/cards')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })

  describe('POST /api/cards', () => {
    it('should create a new card', async () => {
      const mockCard = {
        id: 'card-1',
        title: 'New Card',
        description: 'Card description',
        listId: 'list-1',
        priority: 'high',
        position: 2000,
        assignees: [],
        labels: [],
        checklist: [],
        list: { id: 'list-1', title: 'To Do' },
      }

      // Mock finding the last card in the list
      mockPrisma.card.findFirst.mockResolvedValue({ position: 1000 })
      mockPrisma.card.create.mockResolvedValue(mockCard)

      const request = new NextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Card',
          description: 'Card description',
          listId: 'list-1',
          priority: 'high',
          dueDate: '2024-12-31',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(mockCard)
      expect(mockPrisma.card.create).toHaveBeenCalledWith({
        data: {
          title: 'New Card',
          description: 'Card description',
          listId: 'list-1',
          priority: 'high',
          dueDate: new Date('2024-12-31'),
          position: 2000, // 1000 + 1000
        },
        include: expect.any(Object)
      })
    })

    it('should create card with default priority', async () => {
      mockPrisma.card.findFirst.mockResolvedValue(null) // No existing cards
      mockPrisma.card.create.mockResolvedValue({})

      const request = new NextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Card',
          listId: 'list-1',
        }),
      })

      await POST(request)

      expect(mockPrisma.card.create).toHaveBeenCalledWith({
        data: {
          title: 'New Card',
          description: undefined,
          listId: 'list-1',
          priority: 'medium',
          dueDate: null,
          position: 1000, // 0 + 1000 when no existing cards
        },
        include: expect.any(Object)
      })
    })

    it('should reject without title', async () => {
      const request = new NextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify({
          listId: 'list-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Card title and list ID are required')
    })

    it('should reject without listId', async () => {
      const request = new NextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Card',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Card title and list ID are required')
    })

    it('should handle database errors', async () => {
      const mockError = new Error('Database error')
      mockPrisma.card.findFirst.mockRejectedValue(mockError)

      const request = new NextRequest('http://localhost/api/cards', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Card',
          listId: 'list-1',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Database error')
    })
  })
})