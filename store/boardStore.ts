import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import { 
  Board, 
  List, 
  Card, 
  TeamMember, 
  Label, 
  BoardState, 
  BoardActions,
  CreateBoardRequest,
  CreateListRequest,
  CreateCardRequest,
  UpdateCardRequest,
  CreateTeamMemberRequest,
  MoveCardRequest
} from '@/types'

// API utility functions
async function apiRequest(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'An error occurred')
  }

  return response.json()
}

type Store = BoardState & BoardActions

export const useBoardStore = create<Store>()(
  immer((set, get) => ({
    // Initial state
    boards: [],
    currentBoard: null,
    lists: [],
    cards: [],
    teamMembers: [],
    labels: [],
    isLoading: false,
    error: null,

    // Utility actions
    setError: (error: string | null) => {
      set((state) => {
        state.error = error
      })
    },

    setLoading: (loading: boolean) => {
      set((state) => {
        state.isLoading = loading
      })
    },

    // Board actions
    setCurrentBoard: (boardId: string) => {
      set((state) => {
        const board = state.boards.find(b => b.id === boardId)
        if (board) {
          state.currentBoard = board
          state.lists = board.lists || []
          state.cards = board.lists?.flatMap(list => list.cards) || []
          state.teamMembers = board.members || []
          state.labels = board.labels || []
          
          // Persist current board selection to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('kanbanify-current-board-id', boardId)
          }
        }
      })
    },

    fetchBoards: async () => {
      try {
        set((state) => { state.isLoading = true })
        const boards = await apiRequest('/api/boards')
        set((state) => {
          state.boards = boards
          state.isLoading = false
          state.error = null
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch boards'
          state.isLoading = false
        })
      }
    },

    fetchBoard: async (boardId: string) => {
      try {
        set((state) => { state.isLoading = true })
        const board = await apiRequest(`/api/boards/${boardId}`)
        set((state) => {
          state.currentBoard = board
          state.lists = board.lists || []
          state.cards = board.lists?.flatMap((list: List) => list.cards) || []
          state.teamMembers = board.members || []
          state.labels = board.labels || []
          state.isLoading = false
          state.error = null
          
          // Persist current board selection to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('kanbanify-current-board-id', boardId)
          }
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to fetch board'
          state.isLoading = false
        })
      }
    },

    createBoard: async (boardData: CreateBoardRequest) => {
      try {
        set((state) => { state.isLoading = true })
        const newBoard = await apiRequest('/api/boards', {
          method: 'POST',
          body: JSON.stringify(boardData),
        })
        set((state) => {
          state.boards.unshift(newBoard)
          state.isLoading = false
          state.error = null
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create board'
          state.isLoading = false
        })
      }
    },

    updateBoard: async (boardId: string, updates: Partial<Board>) => {
      try {
        const updatedBoard = await apiRequest(`/api/boards/${boardId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        })
        set((state) => {
          const index = state.boards.findIndex(b => b.id === boardId)
          if (index !== -1) {
            state.boards[index] = updatedBoard
          }
          if (state.currentBoard?.id === boardId) {
            state.currentBoard = updatedBoard
          }
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update board'
        })
      }
    },

    deleteBoard: async (boardId: string) => {
      try {
        await apiRequest(`/api/boards/${boardId}`, { method: 'DELETE' })
        set((state) => {
          state.boards = state.boards.filter(b => b.id !== boardId)
          if (state.currentBoard?.id === boardId) {
            state.currentBoard = null
            state.lists = []
            state.cards = []
            state.teamMembers = []
            state.labels = []
            
            // Clear localStorage if current board was deleted
            if (typeof window !== 'undefined') {
              localStorage.removeItem('kanbanify-current-board-id')
            }
          }
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete board'
        })
      }
    },

    // List actions
    createList: async (listData: CreateListRequest) => {
      try {
        const newList = await apiRequest('/api/lists', {
          method: 'POST',
          body: JSON.stringify(listData),
        })
        set((state) => {
          state.lists.push(newList)
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create list'
        })
      }
    },

    updateList: async (listId: string, updates: Partial<List>) => {
      try {
        const updatedList = await apiRequest(`/api/lists/${listId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        })
        set((state) => {
          const index = state.lists.findIndex(l => l.id === listId)
          if (index !== -1) {
            state.lists[index] = updatedList
          }
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update list'
        })
      }
    },

    deleteList: async (listId: string) => {
      try {
        await apiRequest(`/api/lists/${listId}`, { method: 'DELETE' })
        set((state) => {
          state.lists = state.lists.filter(l => l.id !== listId)
          state.cards = state.cards.filter(c => c.listId !== listId)
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete list'
        })
      }
    },

    reorderLists: async (listIds: string[]) => {
      // Optimistic update
      const originalLists = get().lists
      set((state) => {
        const reorderedLists = listIds.map((id, index) => {
          const list = state.lists.find(l => l.id === id)
          if (list) {
            return { ...list, position: (index + 1) * 1000 }
          }
          return list
        }).filter(Boolean) as List[]
        state.lists = reorderedLists
      })

      try {
        // Update positions for each list
        const updatePromises = listIds.map((id, index) => {
          const newPosition = (index + 1) * 1000
          return apiRequest(`/api/lists/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ position: newPosition }),
          })
        })
        
        await Promise.all(updatePromises)
      } catch (error) {
        // Revert optimistic update on error
        set((state) => {
          state.lists = originalLists
        })
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to reorder lists'
        })
      }
    },

    // Card actions
    createCard: async (cardData: CreateCardRequest) => {
      try {
        const newCard = await apiRequest('/api/cards', {
          method: 'POST',
          body: JSON.stringify(cardData),
        })
        set((state) => {
          state.cards.push(newCard)
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create card'
        })
      }
    },

    updateCard: async (cardId: string, updates: UpdateCardRequest) => {
      // Store original values for potential rollback
      let originalCard: any = null
      
      // Optimistic update
      set((state) => {
        const index = state.cards.findIndex(c => c.id === cardId)
        if (index !== -1) {
          originalCard = { ...state.cards[index] }
          Object.assign(state.cards[index], updates)
        }
      })

      try {
        const updatedCard = await apiRequest(`/api/cards/${cardId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        })
        set((state) => {
          const index = state.cards.findIndex(c => c.id === cardId)
          if (index !== -1) {
            state.cards[index] = updatedCard
          }
        })
      } catch (error) {
        // Rollback optimistic update on error
        if (originalCard) {
          set((state) => {
            const index = state.cards.findIndex(c => c.id === cardId)
            if (index !== -1) {
              state.cards[index] = originalCard
            }
          })
        }
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update card'
        })
      }
    },

    deleteCard: async (cardId: string) => {
      try {
        await apiRequest(`/api/cards/${cardId}`, { method: 'DELETE' })
        set((state) => {
          state.cards = state.cards.filter(c => c.id !== cardId)
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete card'
        })
      }
    },

    moveCard: async (moveData: MoveCardRequest) => {
      // Optimistic update
      set((state) => {
        const cardIndex = state.cards.findIndex(c => c.id === moveData.cardId)
        if (cardIndex !== -1) {
          state.cards[cardIndex].listId = moveData.newListId
          state.cards[cardIndex].position = moveData.newPosition
        }
      })

      try {
        await apiRequest(`/api/cards/${moveData.cardId}`, {
          method: 'PUT',
          body: JSON.stringify({
            listId: moveData.newListId,
            position: moveData.newPosition,
          }),
        })
      } catch (error) {
        // Revert optimistic update on error
        get().fetchBoard(get().currentBoard?.id || '')
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to move card'
        })
      }
    },

    // Team member actions
    createTeamMember: async (memberData: CreateTeamMemberRequest) => {
      try {
        const newMember = await apiRequest('/api/team-members', {
          method: 'POST',
          body: JSON.stringify(memberData),
        })
        set((state) => {
          state.teamMembers.push(newMember)
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to create team member'
        })
      }
    },

    updateTeamMember: async (memberId: string, updates: Partial<TeamMember>) => {
      try {
        const updatedMember = await apiRequest(`/api/team-members/${memberId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        })
        set((state) => {
          const index = state.teamMembers.findIndex(m => m.id === memberId)
          if (index !== -1) {
            state.teamMembers[index] = updatedMember
          }
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update team member'
        })
      }
    },

    deleteTeamMember: async (memberId: string) => {
      try {
        await apiRequest(`/api/team-members/${memberId}`, { method: 'DELETE' })
        set((state) => {
          state.teamMembers = state.teamMembers.filter(m => m.id !== memberId)
        })
      } catch (error) {
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete team member'
        })
      }
    },

    // Assignment actions
    assignMemberToCard: async (cardId: string, memberId: string) => {
      // Get team member info for optimistic update
      const teamMember = get().teamMembers.find(m => m.id === memberId)
      if (!teamMember) return

      // Optimistic update
      set((state) => {
        const cardIndex = state.cards.findIndex(c => c.id === cardId)
        if (cardIndex !== -1) {
          state.cards[cardIndex].assignees = state.cards[cardIndex].assignees || []
          state.cards[cardIndex].assignees.push({
            cardId,
            teamMemberId: memberId,
            teamMember,
            assignedAt: new Date()
          })
        }
      })

      try {
        await apiRequest(`/api/cards/${cardId}/assignments`, {
          method: 'POST',
          body: JSON.stringify({ teamMemberId: memberId }),
        })
      } catch (error) {
        // Rollback optimistic update on error
        set((state) => {
          const cardIndex = state.cards.findIndex(c => c.id === cardId)
          if (cardIndex !== -1 && state.cards[cardIndex].assignees) {
            state.cards[cardIndex].assignees = state.cards[cardIndex].assignees.filter(
              assignment => assignment.teamMemberId !== memberId
            )
          }
          state.error = error instanceof Error ? error.message : 'Failed to assign member'
        })
      }
    },

    unassignMemberFromCard: async (cardId: string, memberId: string) => {
      // Store assignment for potential rollback
      let originalAssignment: any = null

      // Optimistic update
      set((state) => {
        const cardIndex = state.cards.findIndex(c => c.id === cardId)
        if (cardIndex !== -1 && state.cards[cardIndex].assignees) {
          const assignmentIndex = state.cards[cardIndex].assignees.findIndex(
            assignment => assignment.teamMemberId === memberId
          )
          if (assignmentIndex !== -1) {
            originalAssignment = state.cards[cardIndex].assignees[assignmentIndex]
            state.cards[cardIndex].assignees.splice(assignmentIndex, 1)
          }
        }
      })

      try {
        await apiRequest(`/api/cards/${cardId}/assignments?teamMemberId=${memberId}`, {
          method: 'DELETE',
        })
      } catch (error) {
        // Rollback optimistic update on error
        if (originalAssignment) {
          set((state) => {
            const cardIndex = state.cards.findIndex(c => c.id === cardId)
            if (cardIndex !== -1) {
              state.cards[cardIndex].assignees = state.cards[cardIndex].assignees || []
              state.cards[cardIndex].assignees.push(originalAssignment)
            }
          })
        }
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to unassign member'
        })
      }
    },

    // Label actions (placeholder implementations)
    createLabel: async (labelData: Omit<Label, 'id' | 'cards'>) => {
      // TODO: Implement when label API is ready
      console.log('createLabel not yet implemented', labelData)
    },

    updateLabel: async (labelId: string, updates: Partial<Label>) => {
      // TODO: Implement when label API is ready
      console.log('updateLabel not yet implemented', labelId, updates)
    },

    deleteLabel: async (labelId: string) => {
      // TODO: Implement when label API is ready
      console.log('deleteLabel not yet implemented', labelId)
    },

    addLabelToCard: async (cardId: string, labelId: string) => {
      // TODO: Implement when label API is ready
      console.log('addLabelToCard not yet implemented', cardId, labelId)
    },

    removeLabelFromCard: async (cardId: string, labelId: string) => {
      // TODO: Implement when label API is ready
      console.log('removeLabelFromCard not yet implemented', cardId, labelId)
    },

    // Checklist actions
    createChecklistItem: async (itemData) => {
      // Generate temporary ID for optimistic update
      const tempId = `temp-${Date.now()}`
      const optimisticItem = {
        ...itemData,
        id: tempId,
        createdAt: new Date(),
      }

      // Optimistic update
      set((state) => {
        const cardIndex = state.cards.findIndex(c => c.id === itemData.cardId)
        if (cardIndex !== -1) {
          state.cards[cardIndex].checklist = state.cards[cardIndex].checklist || []
          state.cards[cardIndex].checklist.push(optimisticItem)
        }
      })

      try {
        const newItem = await apiRequest('/api/checklist', {
          method: 'POST',
          body: JSON.stringify(itemData),
        })
        
        // Replace optimistic item with real data
        set((state) => {
          const cardIndex = state.cards.findIndex(c => c.id === itemData.cardId)
          if (cardIndex !== -1) {
            const checklistIndex = state.cards[cardIndex].checklist?.findIndex(item => item.id === tempId)
            if (checklistIndex !== undefined && checklistIndex !== -1 && state.cards[cardIndex].checklist) {
              state.cards[cardIndex].checklist[checklistIndex] = newItem
            }
          }
        })
      } catch (error) {
        // Remove optimistic item on error
        set((state) => {
          const cardIndex = state.cards.findIndex(c => c.id === itemData.cardId)
          if (cardIndex !== -1 && state.cards[cardIndex].checklist) {
            state.cards[cardIndex].checklist = state.cards[cardIndex].checklist.filter(item => item.id !== tempId)
          }
          state.error = error instanceof Error ? error.message : 'Failed to create checklist item'
        })
      }
    },

    updateChecklistItem: async (itemId: string, updates) => {
      // Store original values for potential rollback
      let originalItem: any = null
      let cardIndex = -1
      let checklistIndex = -1

      // Optimistic update
      set((state) => {
        cardIndex = state.cards.findIndex(card => 
          card.checklist?.some(item => item.id === itemId)
        )
        
        if (cardIndex !== -1 && state.cards[cardIndex].checklist) {
          checklistIndex = state.cards[cardIndex].checklist.findIndex(item => item.id === itemId)
          if (checklistIndex !== -1) {
            originalItem = { ...state.cards[cardIndex].checklist[checklistIndex] }
            Object.assign(state.cards[cardIndex].checklist[checklistIndex], updates)
          }
        }
      })

      try {
        await apiRequest(`/api/checklist/${itemId}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        })
      } catch (error) {
        // Rollback optimistic update on error
        if (originalItem && cardIndex !== -1 && checklistIndex !== -1) {
          set((state) => {
            if (state.cards[cardIndex]?.checklist?.[checklistIndex]) {
              state.cards[cardIndex].checklist[checklistIndex] = originalItem
            }
          })
        }
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to update checklist item'
        })
      }
    },

    deleteChecklistItem: async (itemId: string) => {
      // Store original values for potential rollback
      let originalItem: any = null
      let cardIndex = -1
      let checklistIndex = -1

      // Optimistic update - remove item
      set((state) => {
        cardIndex = state.cards.findIndex(card => 
          card.checklist?.some(item => item.id === itemId)
        )
        
        if (cardIndex !== -1 && state.cards[cardIndex].checklist) {
          checklistIndex = state.cards[cardIndex].checklist.findIndex(item => item.id === itemId)
          if (checklistIndex !== -1) {
            originalItem = { ...state.cards[cardIndex].checklist[checklistIndex] }
            state.cards[cardIndex].checklist.splice(checklistIndex, 1)
          }
        }
      })

      try {
        await apiRequest(`/api/checklist/${itemId}`, { method: 'DELETE' })
      } catch (error) {
        // Rollback optimistic update on error
        if (originalItem && cardIndex !== -1 && checklistIndex !== -1) {
          set((state) => {
            if (state.cards[cardIndex]?.checklist) {
              state.cards[cardIndex].checklist.splice(checklistIndex, 0, originalItem)
            }
          })
        }
        
        set((state) => {
          state.error = error instanceof Error ? error.message : 'Failed to delete checklist item'
        })
      }
    },
  }))
)