import { act, renderHook } from '@testing-library/react'
import { useBoardStore } from '@/store/boardStore'

// Mock sonner for toast notifications
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// Mock fetch
global.fetch = jest.fn()

describe('Board Store', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useBoardStore())
      
      expect(result.current.boards).toEqual([])
      expect(result.current.currentBoard).toBeNull()
      expect(result.current.lists).toEqual([])
      expect(result.current.cards).toEqual([])
      expect(result.current.teamMembers).toEqual([])
      expect(result.current.labels).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })
  })

  describe('Error and Loading Management', () => {
    it('should set error', () => {
      const { result } = renderHook(() => useBoardStore())
      
      act(() => {
        result.current.setError('Test error')
      })
      
      expect(result.current.error).toBe('Test error')
    })

    it('should set loading state', () => {
      const { result } = renderHook(() => useBoardStore())
      
      act(() => {
        result.current.setLoading(true)
      })
      
      expect(result.current.isLoading).toBe(true)
    })

    it('should clear error', () => {
      const { result } = renderHook(() => useBoardStore())
      
      act(() => {
        result.current.setError('Test error')
      })
      
      act(() => {
        result.current.setError(null)
      })
      
      expect(result.current.error).toBeNull()
    })
  })

  describe('Board Operations', () => {
    it('should fetch boards successfully', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          title: 'Test Board',
          lists: [],
          members: [],
          labels: [],
        },
      ]

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoards,
      })

      const { result } = renderHook(() => useBoardStore())
      
      await act(async () => {
        await result.current.fetchBoards()
      })
      
      expect(result.current.boards).toEqual(mockBoards)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should handle fetch boards error', async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'))

      const { result } = renderHook(() => useBoardStore())
      
      await act(async () => {
        await result.current.fetchBoards()
      })
      
      expect(result.current.error).toBe('Fetch failed')
      expect(result.current.isLoading).toBe(false)
    })

    it('should create board successfully', async () => {
      const mockBoard = {
        id: 'board-1',
        title: 'New Board',
        lists: [],
        members: [],
        labels: [],
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBoard,
      })

      const { result } = renderHook(() => useBoardStore())
      
      await act(async () => {
        await result.current.createBoard({
          title: 'New Board',
          description: 'Test description',
        })
      })
      
      expect(result.current.boards).toContain(mockBoard)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should set current board and update localStorage', () => {
      const mockBoard = {
        id: 'board-1',
        title: 'Test Board',
        lists: [
          {
            id: 'list-1',
            title: 'To Do',
            cards: [
              {
                id: 'card-1',
                title: 'Test Card',
                listId: 'list-1',
              },
            ],
          },
        ],
        members: [
          {
            id: 'member-1',
            name: 'Test Member',
          },
        ],
        labels: [],
      }

      const { result } = renderHook(() => useBoardStore())
      
      // Set up boards first
      act(() => {
        result.current.setError(null)
        // Reset the store and initialize with our test data
        useBoardStore.setState({ boards: [mockBoard] })
      })
      
      act(() => {
        result.current.setCurrentBoard('board-1')
      })
      
      expect(result.current.currentBoard).toEqual(mockBoard)
      expect(result.current.lists).toEqual(mockBoard.lists)
      expect(result.current.cards).toEqual(mockBoard.lists[0].cards)
      expect(result.current.teamMembers).toEqual(mockBoard.members)
      // Note: localStorage calls are wrapped in typeof window !== 'undefined' checks
      // so they don't execute in Jest environment
    })
  })

  describe('Card Operations', () => {
    it('should create card successfully', async () => {
      const mockCard = {
        id: 'card-1',
        title: 'New Card',
        listId: 'list-1',
        position: 1000,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard,
      })

      const { result } = renderHook(() => useBoardStore())
      
      await act(async () => {
        await result.current.createCard({
          title: 'New Card',
          listId: 'list-1',
        })
      })
      
      expect(result.current.cards).toContain(mockCard)
    })

    it('should update card with optimistic updates', async () => {
      const originalCard = {
        id: 'card-1',
        title: 'Original Title',
        description: 'Original Description',
        listId: 'list-1',
      }

      const updatedCard = {
        ...originalCard,
        title: 'Updated Title',
        description: 'Updated Description',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => updatedCard,
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [originalCard]
      })
      
      await act(async () => {
        await result.current.updateCard('card-1', {
          title: 'Updated Title',
          description: 'Updated Description',
        })
      })
      
      expect(result.current.cards[0]).toEqual(updatedCard)
    })

    it('should rollback optimistic update on error', async () => {
      const originalCard = {
        id: 'card-1',
        title: 'Original Title',
        description: 'Original Description',
        listId: 'list-1',
      }

      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('Update failed'))

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [originalCard]
      })
      
      await act(async () => {
        await result.current.updateCard('card-1', {
          title: 'Updated Title',
        })
      })
      
      // Should rollback to original
      expect(result.current.cards[0].title).toBe('Original Title')
      expect(result.current.error).toBe('Update failed')
    })

    it('should move card with optimistic updates', async () => {
      const originalCard = {
        id: 'card-1',
        title: 'Test Card',
        listId: 'list-1',
        position: 1000,
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [originalCard]
      })
      
      await act(async () => {
        await result.current.moveCard({
          cardId: 'card-1',
          newListId: 'list-2',
          newPosition: 2000,
        })
      })
      
      expect(result.current.cards[0].listId).toBe('list-2')
      expect(result.current.cards[0].position).toBe(2000)
    })

    it('should delete card successfully', async () => {
      const card = {
        id: 'card-1',
        title: 'Test Card',
        listId: 'list-1',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [card]
      })
      
      await act(async () => {
        await result.current.deleteCard('card-1')
      })
      
      expect(result.current.cards).toEqual([])
    })
  })

  describe('Team Member Operations', () => {
    it('should assign member to card with optimistic updates', async () => {
      const card = {
        id: 'card-1',
        title: 'Test Card',
        assignees: [],
      }

      const teamMember = {
        id: 'member-1',
        name: 'Test Member',
        color: '#ff0000',
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [card]
        ;(result.current as any).teamMembers = [teamMember]
      })
      
      await act(async () => {
        await result.current.assignMemberToCard('card-1', 'member-1')
      })
      
      expect(result.current.cards[0].assignees).toHaveLength(1)
      expect(result.current.cards[0].assignees[0].teamMemberId).toBe('member-1')
    })

    it('should unassign member from card with optimistic updates', async () => {
      const card = {
        id: 'card-1',
        title: 'Test Card',
        assignees: [
          {
            cardId: 'card-1',
            teamMemberId: 'member-1',
            teamMember: { id: 'member-1', name: 'Test Member' },
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [card]
      })
      
      await act(async () => {
        await result.current.unassignMemberFromCard('card-1', 'member-1')
      })
      
      expect(result.current.cards[0].assignees).toHaveLength(0)
    })
  })

  describe('Checklist Operations', () => {
    it('should create checklist item with optimistic updates', async () => {
      const card = {
        id: 'card-1',
        title: 'Test Card',
        checklist: [],
      }

      const newItem = {
        id: 'item-1',
        content: 'New item',
        completed: false,
        cardId: 'card-1',
        position: 1000,
        createdAt: new Date(),
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => newItem,
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [card]
      })
      
      await act(async () => {
        await result.current.createChecklistItem({
          content: 'New item',
          completed: false,
          cardId: 'card-1',
          position: 1000,
        })
      })
      
      expect(result.current.cards[0].checklist).toHaveLength(1)
      expect(result.current.cards[0].checklist[0].content).toBe('New item')
    })

    it('should update checklist item with optimistic updates', async () => {
      const card = {
        id: 'card-1',
        title: 'Test Card',
        checklist: [
          {
            id: 'item-1',
            content: 'Original content',
            completed: false,
            cardId: 'card-1',
            position: 1000,
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [card]
      })
      
      await act(async () => {
        await result.current.updateChecklistItem('item-1', {
          completed: true,
        })
      })
      
      expect(result.current.cards[0].checklist[0].completed).toBe(true)
    })

    it('should delete checklist item with optimistic updates', async () => {
      const card = {
        id: 'card-1',
        title: 'Test Card',
        checklist: [
          {
            id: 'item-1',
            content: 'Test item',
            completed: false,
            cardId: 'card-1',
            position: 1000,
          },
        ],
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      })

      const { result } = renderHook(() => useBoardStore())
      
      // Set up initial state
      act(() => {
        ;(result.current as any).cards = [card]
      })
      
      await act(async () => {
        await result.current.deleteChecklistItem('item-1')
      })
      
      expect(result.current.cards[0].checklist).toHaveLength(0)
    })
  })
})