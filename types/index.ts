// Base types matching Prisma schema
export interface Board {
  id: string
  title: string
  description?: string
  background: string
  lists: List[]
  labels: Label[]
  members: TeamMember[]
  createdAt: Date
  updatedAt: Date
}

export interface TeamMember {
  id: string
  name: string
  color: string
  boardId: string
  board?: Board
  cards: CardAssignment[]
  createdAt: Date
}

export interface List {
  id: string
  title: string
  position: number
  boardId: string
  board?: Board
  cards: Card[]
  createdAt: Date
}

export interface Card {
  id: string
  title: string
  description?: string
  position: number
  dueDate?: Date
  priority: 'low' | 'medium' | 'high'
  status: 'active' | 'completed' | 'archived'
  listId: string
  list?: List
  labels: CardLabel[]
  checklist: ChecklistItem[]
  assignees: CardAssignment[]
  createdAt: Date
  updatedAt: Date
}

export interface CardAssignment {
  cardId: string
  teamMemberId: string
  card?: Card
  teamMember?: TeamMember
  assignedAt: Date
}

export interface Label {
  id: string
  name: string
  color: string
  boardId: string
  board?: Board
  cards: CardLabel[]
}

export interface CardLabel {
  cardId: string
  labelId: string
  card?: Card
  label?: Label
}

export interface ChecklistItem {
  id: string
  content: string
  completed: boolean
  cardId: string
  card?: Card
  position: number
  createdAt: Date
}

// UI-specific types for current implementation
export interface Assignee {
  id: string
  name: string
  avatar?: string
}

export interface CardData {
  id: string
  title: string
  description: string
  assignees: Assignee[]
  dueDate: string
  priority: string
  listId: string
}

export interface ListData {
  id: string
  title: string
  cards: CardData[]
}

// API request/response types
export interface CreateCardRequest {
  title: string
  listId: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
}

export interface UpdateCardRequest {
  title?: string
  description?: string
  priority?: 'low' | 'medium' | 'high'
  dueDate?: string
  listId?: string
  position?: number
}

export interface CreateListRequest {
  title: string
  boardId: string
  position?: number
}

export interface CreateBoardRequest {
  title: string
  description?: string
  background?: string
}

export interface CreateTeamMemberRequest {
  name: string
  boardId: string
  color?: string
}

export interface MoveCardRequest {
  cardId: string
  newListId: string
  newPosition: number
}

// Store state types
export interface BoardState {
  boards: Board[]
  currentBoard: Board | null
  lists: List[]
  cards: Card[]
  teamMembers: TeamMember[]
  labels: Label[]
  isLoading: boolean
  error: string | null
}

export interface BoardActions {
  // Board actions
  setCurrentBoard: (boardId: string) => void
  createBoard: (board: CreateBoardRequest) => Promise<void>
  updateBoard: (boardId: string, updates: Partial<Board>) => Promise<void>
  deleteBoard: (boardId: string) => Promise<void>
  
  // List actions
  createList: (list: CreateListRequest) => Promise<void>
  updateList: (listId: string, updates: Partial<List>) => Promise<void>
  deleteList: (listId: string) => Promise<void>
  reorderLists: (listIds: string[]) => Promise<void>
  
  // Card actions
  createCard: (card: CreateCardRequest) => Promise<void>
  updateCard: (cardId: string, updates: UpdateCardRequest) => Promise<void>
  deleteCard: (cardId: string) => Promise<void>
  moveCard: (move: MoveCardRequest) => Promise<void>
  
  // Team member actions
  createTeamMember: (member: CreateTeamMemberRequest) => Promise<void>
  updateTeamMember: (memberId: string, updates: Partial<TeamMember>) => Promise<void>
  deleteTeamMember: (memberId: string) => Promise<void>
  
  // Assignment actions
  assignMemberToCard: (cardId: string, memberId: string) => Promise<void>
  unassignMemberFromCard: (cardId: string, memberId: string) => Promise<void>
  
  // Label actions
  createLabel: (label: Omit<Label, 'id' | 'cards'>) => Promise<void>
  updateLabel: (labelId: string, updates: Partial<Label>) => Promise<void>
  deleteLabel: (labelId: string) => Promise<void>
  addLabelToCard: (cardId: string, labelId: string) => Promise<void>
  removeLabelFromCard: (cardId: string, labelId: string) => Promise<void>
  
  // Checklist actions
  createChecklistItem: (item: Omit<ChecklistItem, 'id' | 'createdAt' | 'card'>) => Promise<void>
  updateChecklistItem: (itemId: string, updates: Partial<ChecklistItem>) => Promise<void>
  deleteChecklistItem: (itemId: string) => Promise<void>
  
  // Data fetching
  fetchBoard: (boardId: string) => Promise<void>
  fetchBoards: () => Promise<void>
  
  // Error handling
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
}