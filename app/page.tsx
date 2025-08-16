"use client"

import { useEffect, useState, useRef } from "react"
import { useBoardStore } from "@/store/boardStore"
import {
  Plus,
  MoreHorizontal,
  Search,
  Bell,
  User,
  Home,
  Folder,
  Settings,
  ChevronDown,
  Filter,
  Calendar,
  Users,
  Edit,
  Trash2,
  Archive,
  CheckSquare,
  Palette,
  Crown,
  Key,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  rectIntersection,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card as CardType, List as ListType, TeamMember } from "@/types"
import { CardDetailModal } from "@/components/modals/CardDetailModal"
import { TeamMemberManager } from "@/components/board/TeamMemberManager"
import { BoardManager } from "@/components/board/BoardManager"
import { BoardAccessGate } from "@/components/auth/BoardAccessGate"
import { AdminLogin } from "@/components/auth/AdminLogin"
import { BoardAccessModal } from "@/components/modals/BoardAccessModal"
import { CalendarView } from "@/components/calendar/CalendarView"
import { isAdminSession, logoutAdmin } from "@/lib/auth"
import { getBoardAccess } from "@/lib/boardAccess"

const LIST_COLORS = [
  "#f1f5f9", // Default light gray
  "#fef2f2", // Light red
  "#fef3e2", // Light orange
  "#fdfde8", // Light yellow
  "#f0fdf4", // Light green
  "#f0f9ff", // Light blue
  "#faf5ff", // Light purple
  "#fdf2f8", // Light pink
  "#f9fafb", // Light gray
]

function DraggableCard({ card, onCardClick }: { card: CardType; onCardClick: (card: CardType) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Calculate checklist progress
  const checklist = card.checklist || []
  const completedItems = checklist.filter(item => item.completed).length
  const totalItems = checklist.length
  const hasChecklist = totalItems > 0

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-4 cursor-grab hover:shadow-md transition-shadow ${isDragging ? "opacity-50" : ""}`}
      onClick={(e) => {
        // Only trigger card click if not dragging
        if (!isDragging && e.detail === 1) {
          onCardClick(card)
        }
      }}
    >
      <div className="space-y-3">
        <h3 className="font-medium text-card-foreground font-heading">{card.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
        
        {/* Checklist progress */}
        {hasChecklist && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckSquare className="h-3 w-3" />
            <span>
              {completedItems}/{totalItems} tasks
            </span>
            <div className="flex-1 bg-muted rounded-full h-1">
              <div 
                className={`h-1 rounded-full transition-all ${
                  completedItems === totalItems ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${totalItems > 0 ? (completedItems / totalItems) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(card.priority || 'medium')}`}>
            {card.priority || 'medium'}
          </span>
          {card.dueDate && (
            <span className="text-xs text-muted-foreground">Due: {new Date(card.dueDate).toLocaleDateString()}</span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {card.assignees?.map((assignment) => (
              <Avatar key={assignment.teamMemberId} className="h-8 w-8 border-2 border-background">
                <AvatarFallback className="text-xs" style={{ backgroundColor: assignment.teamMember?.color }}>
                  {assignment.teamMember?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("") || '?'}
                </AvatarFallback>
              </Avatar>
            )) || []}
          </div>
        </div>
      </div>
    </Card>
  )
}

function SortableList({ list, onCardClick, isCalendarView = false }: { list: ListType & { cards: CardType[] }; onCardClick: (card: CardType) => void; isCalendarView?: boolean }) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging,
    isOver 
  } = useSortable({ 
    id: list.id,
    data: {
      type: 'list',
      list,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`transition-all ${isDragging ? 'opacity-50' : ''} ${isOver ? 'scale-105' : ''}`}
    >
      <DroppableList 
        list={list} 
        onCardClick={onCardClick}
        dragHandleProps={{ ...attributes, ...listeners }}
        isCalendarView={isCalendarView}
      />
    </div>
  )
}

function DroppableList({ 
  list, 
  onCardClick, 
  dragHandleProps,
  isCalendarView = false
}: { 
  list: ListType & { cards: CardType[] }; 
  onCardClick: (card: CardType) => void;
  dragHandleProps?: any;
  isCalendarView?: boolean;
}) {
  const { createCard, updateList, deleteList } = useBoardStore()
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isEditingList, setIsEditingList] = useState(false)
  const [editListTitle, setEditListTitle] = useState(list.title)
  const [editListColor, setEditListColor] = useState(list.color || "#f1f5f9")
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  
  const { isOver, setNodeRef } = useDroppable({
    id: list.id,
  })

  const handleAddCard = async () => {
    if (!newCardTitle.trim()) return

    try {
      await createCard({
        title: newCardTitle.trim(),
        listId: list.id,
        description: "",
        priority: "medium",
      })
      setNewCardTitle("")
      setIsAddingCard(false)
    } catch (error) {
      console.error("Failed to add card:", error)
    }
  }

  const handleEditList = async () => {
    if (!editListTitle.trim()) return

    try {
      await updateList(list.id, {
        title: editListTitle.trim(),
        color: editListColor,
      })
      setIsEditingList(false)
    } catch (error) {
      console.error("Failed to update list:", error)
    }
  }

  const handleDeleteList = async () => {
    if (list.cards.length > 0) {
      if (!confirm(`Delete "${list.title}"? This will also delete all ${list.cards.length} cards in this list.`)) {
        return
      }
    }

    try {
      await deleteList(list.id)
    } catch (error) {
      console.error("Failed to delete list:", error)
    }
  }
  return (
    <div 
      className={`flex-shrink-0 rounded-lg p-3 border ${
        isCalendarView 
          ? "w-64 lg:w-56 xl:w-64" 
          : "w-80"
      }`} 
      style={{ backgroundColor: list.color || "#f1f5f9" }}
    >
      <div className="flex items-center justify-between mb-4">
        {isEditingList ? (
          <div className="flex items-center gap-2 flex-1">
            <Input
              value={editListTitle}
              onChange={(e) => setEditListTitle(e.target.value)}
              className="h-8 text-sm font-semibold"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleEditList()
                } else if (e.key === "Escape") {
                  setIsEditingList(false)
                  setEditListTitle(list.title)
                  setEditListColor(list.color || "#f1f5f9")
                }
              }}
              onBlur={handleEditList}
              autoFocus
            />
          </div>
        ) : (
          <h2 
            className="font-semibold text-foreground font-heading flex items-center gap-2 cursor-grab"
            {...dragHandleProps}
          >
            {list.title}
            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">{list.cards.length}</span>
          </h2>
        )}
        
        <div className="flex items-center gap-1">
          <Popover open={isColorPickerOpen} onOpenChange={setIsColorPickerOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Palette className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3" align="end" sideOffset={8}>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">List Color</h4>
                <div className="grid grid-cols-3 gap-2">
                  {LIST_COLORS.map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform ${
                        editListColor === color
                          ? "border-foreground"
                          : "border-transparent hover:border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={async () => {
                        setEditListColor(color)
                        try {
                          await updateList(list.id, {
                            title: list.title,
                            color: color,
                          })
                          setIsColorPickerOpen(false)
                        } catch (error) {
                          console.error("Failed to update list color:", error)
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditingList(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit List
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleDeleteList}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete List
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className={`min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-all duration-200 ${
          list.cards.length === 0 
            ? `bg-muted/30 ${isOver ? "border-primary bg-primary/10 shadow-lg" : "border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/50"}`
            : `bg-background/50 ${isOver ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"}`
        }`}
      >
        <SortableContext items={list.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[180px]">
            {list.cards.map((card) => (
              <DraggableCard key={card.id} card={card} onCardClick={onCardClick} />
            ))}
            {list.cards.length === 0 && !isAddingCard && (
              <div className={`flex flex-col items-center justify-center h-40 text-muted-foreground text-sm transition-all ${
                isOver ? "text-primary font-medium scale-105" : ""
              }`}>
                <div className={`mb-2 p-3 rounded-full border-2 border-dashed transition-all ${
                  isOver ? "border-primary bg-primary/10" : "border-muted-foreground/30"
                }`}>
                  <Plus className={`h-6 w-6 transition-all ${isOver ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  {isOver ? "Drop card here" : "Drop cards here or add a new one"}
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </div>

      {isAddingCard ? (
        <div className="mt-3 space-y-2">
          <Input
            value={newCardTitle}
            onChange={(e) => setNewCardTitle(e.target.value)}
            placeholder="Enter card title..."
            className="w-full"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleAddCard()
              } else if (e.key === "Escape") {
                setIsAddingCard(false)
                setNewCardTitle("")
              }
            }}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddCard} disabled={!newCardTitle.trim()}>
              Add Card
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsAddingCard(false)
                setNewCardTitle("")
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="ghost" 
          className="w-full justify-start text-muted-foreground hover:text-foreground mt-3"
          onClick={() => setIsAddingCard(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add a card
        </Button>
      )}
    </div>
  )
}

export default function KanbanBoard() {
  const {
    currentBoard,
    lists,
    cards,
    teamMembers,
    boards,
    isLoading,
    error,
    fetchBoard,
    fetchBoards,
    moveCard,
    createList,
    setCurrentBoard,
    reorderLists,
  } = useBoardStore()

  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const [activeList, setActiveList] = useState<ListType | null>(null)
  const [selectedCard, setSelectedCard] = useState<CardType | null>(null)
  const [isCardModalOpen, setIsCardModalOpen] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState("all")
  const [memberFilter, setMemberFilter] = useState("all")
  const [isAddingList, setIsAddingList] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [showBoardAccessModal, setShowBoardAccessModal] = useState(false)
  const [showCalendarView, setShowCalendarView] = useState(false)
  const initializedRef = useRef(false)

  // Check admin status on mount
  useEffect(() => {
    setIsAdmin(isAdminSession())
  }, [])

  // Load initial data
  useEffect(() => {
    const initializeApp = async () => {
      if (!initializedRef.current) {
        initializedRef.current = true
        await fetchBoards()
      }
    }
    initializeApp()
  }, [])

  // Check for users with no accessible boards and show modal
  useEffect(() => {
    if (boards.length > 0 && initializedRef.current && !isLoading) {
      const accessibleBoards = isAdmin ? boards : boards.filter(board => 
        getBoardAccess().includes(board.id)
      )
      
      // If user has no accessible boards, show access modal
      if (accessibleBoards.length === 0) {
        setShowBoardAccessModal(true)
      }
    }
  }, [boards, isAdmin, isLoading])

  // Auto-select board based on localStorage or fallback to first accessible board
  useEffect(() => {
    if (!currentBoard && boards.length > 0 && initializedRef.current) {
      try {
        // Get accessible boards (admin can access all, non-admin needs access codes)
        const accessibleBoards = isAdmin ? boards : boards.filter(board => 
          getBoardAccess().includes(board.id)
        )
        
        if (accessibleBoards.length > 0) {
          // Try to restore the last selected board from localStorage if it's accessible
          const lastBoardId = localStorage.getItem('kanbanify-current-board-id')
          const lastBoard = lastBoardId ? accessibleBoards.find(b => b.id === lastBoardId) : null
          
          // Use last board if found and accessible, otherwise use the first accessible board
          const boardToSelect = lastBoard || accessibleBoards[0]
          fetchBoard(boardToSelect.id)
        } else {
          // No accessible boards - modal will be shown by other useEffect
          console.log('No accessible boards found')
        }
      } catch (error) {
        console.error('Error in board auto-selection:', error)
        // Clear potentially corrupted localStorage data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('kanbanify-current-board-id')
        }
      }
    }
  }, [boards, currentBoard, isAdmin])

  const handleCardClick = (card: CardType) => {
    setSelectedCard(card)
    setIsCardModalOpen(true)
  }

  const handleAddList = async () => {
    if (!newListTitle.trim() || !currentBoard) return

    try {
      await createList({
        title: newListTitle.trim(),
        boardId: currentBoard.id,
      })
      setNewListTitle("")
      setIsAddingList(false)
    } catch (error) {
      console.error("Failed to add list:", error)
    }
  }

  const handleSignOut = () => {
    if (isAdmin) {
      logoutAdmin()
      setIsAdmin(false)
    }
    
    // Optionally clear all board access when signing out
    // Uncomment the line below if you want to clear board access on sign out
    // clearAllBoardAccess()
    
    // Refresh the page to ensure proper UI state
    window.location.reload()
  }

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true)
    setShowAdminLogin(false)
  }

  const handleBoardAccessSuccess = async () => {
    // Refresh boards and close modal
    await fetchBoards()
    setShowBoardAccessModal(false)
  }

  // Create lists with associated cards
  const listsWithCards = lists.map(list => ({
    ...list,
    cards: cards.filter(card => card.listId === list.id)
  }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  // Custom collision detection for mixed list and card dragging
  const customCollisionDetection = (args: any) => {
    const { active, droppableRects, droppableContainers, pointerCoordinates } = args
    
    if (active.data.current?.type === 'list') {
      // For list dragging, use rectIntersection for better horizontal detection
      return rectIntersection(args)
    } else {
      // For card dragging, we need special handling for empty lists
      
      // Get all list containers (these are the main drop zones for each list)
      const listContainers = Array.from(droppableContainers.values()).filter(
        container => lists.some(list => list.id === container.id)
      )
      
      // Check if pointer is directly over any list container
      if (pointerCoordinates) {
        const directListHit = listContainers.find(container => {
          const rect = droppableRects.get(container.id)
          if (!rect) return false
          
          return (
            pointerCoordinates.x >= rect.left &&
            pointerCoordinates.x <= rect.right &&
            pointerCoordinates.y >= rect.top &&
            pointerCoordinates.y <= rect.bottom
          )
        })
        
        if (directListHit) {
          return [{ id: directListHit.id }]
        }
      }
      
      // Fall back to standard collision detection
      const closestCornersResult = closestCorners(args)
      
      // If no result from closestCorners, try rectIntersection
      if (!closestCornersResult || closestCornersResult.length === 0) {
        return rectIntersection(args)
      }
      
      return closestCornersResult
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    
    if (active.data.current?.type === 'list') {
      const list = active.data.current.list
      setActiveList(list)
    } else {
      const card = cards.find((card) => card.id === active.id)
      if (card) {
        setActiveCard(card)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)
    setActiveList(null)

    if (!over) return

    // Handle list reordering
    if (active.data.current?.type === 'list') {
      const activeListId = active.id as string
      const overListId = over.id as string
      
      console.log('Dragging list:', activeListId, 'over:', overListId)
      
      if (activeListId !== overListId) {
        const oldIndex = lists.findIndex(list => list.id === activeListId)
        let newIndex = lists.findIndex(list => list.id === overListId)
        
        console.log('Old index:', oldIndex, 'New index:', newIndex)
        
        // If dropping on a card, find its parent list
        if (newIndex === -1) {
          const overCard = cards.find(card => card.id === overListId)
          if (overCard) {
            newIndex = lists.findIndex(list => list.id === overCard.listId)
            console.log('Found parent list index:', newIndex)
          }
        }
        
        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          console.log('Reordering lists from', oldIndex, 'to', newIndex)
          // Create new order
          const reorderedListIds = [...lists]
          const [removed] = reorderedListIds.splice(oldIndex, 1)
          reorderedListIds.splice(newIndex, 0, removed)
          
          reorderLists(reorderedListIds.map(list => list.id))
        }
      }
      return
    }

    // Handle card movement (existing logic)
    const activeCardId = active.id as string
    const overCardId = over.id as string

    // Find the active card
    const activeCard = cards.find(card => card.id === activeCardId)
    if (!activeCard) return

    // Find target list
    let targetListId = ''
    let targetPosition = 0

    // Check if dropping on another card
    const targetCard = cards.find(card => card.id === overCardId)
    if (targetCard) {
      targetListId = targetCard.listId
      targetPosition = targetCard.position
    } else {
      // Dropping on a list
      const targetList = lists.find(list => list.id === overCardId)
      if (targetList) {
        targetListId = targetList.id
        const listCards = cards.filter(card => card.listId === targetList.id)
        targetPosition = listCards.length > 0 ? Math.max(...listCards.map(c => c.position)) + 1000 : 1000
      }
    }

    if (targetListId && (targetListId !== activeCard.listId || targetPosition !== activeCard.position)) {
      moveCard({
        cardId: activeCardId,
        newListId: targetListId,
        newPosition: targetPosition
      })
    }
  }

  // Filtered lists based on search and filter
  const filteredLists = listsWithCards.map((list) => ({
    ...list,
    cards: list.cards.filter((card) => {
      const matchesSearch =
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (card.description || '').toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterBy === "all" || card.priority === filterBy
      const matchesMember = memberFilter === "all" || 
        card.assignees?.some(assignment => assignment.teamMemberId === memberFilter)
      return matchesSearch && matchesFilter && matchesMember
    }),
  }))

  return (
    <div className="min-h-screen flex relative">
      <div className="absolute inset-0 bg-pattern-dots opacity-30 pointer-events-none" />

      {/* Sidebar for board navigation */}
      <aside
        className={`bg-sidebar/95 backdrop-blur-sm border-r border-sidebar-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-16"
        } flex flex-col relative z-10`}
      >
        <div className="p-4 border-b border-sidebar-border">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`w-full ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <Home className="h-5 w-5" />
            {sidebarOpen && <span className="ml-2">Dashboard</span>}
          </Button>
        </div>

        {sidebarOpen && (
          <div className="flex-1 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-sidebar-foreground mb-2">Current Board</h3>
              <div className="space-y-1">
                <div className="p-2 bg-muted rounded-md">
                  <div className="text-sm font-medium">{currentBoard?.title || 'No board selected'}</div>
                  {currentBoard?.description ? (
                    <div className="text-xs text-muted-foreground">{currentBoard.description}</div>
                  ) : !currentBoard ? (
                    <div className="text-xs text-muted-foreground">Select or access a board to get started</div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <BoardManager 
                trigger={
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <Folder className="h-4 w-4 mr-2" />
                    Boards
                  </Button>
                }
              />
              <TeamMemberManager 
                trigger={
                  <Button variant="ghost" className="w-full justify-start text-sm">
                    <Users className="h-4 w-4 mr-2" />
                    Team Members
                  </Button>
                }
              />
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col relative z-10">
        <header className="border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground font-heading">
                  {currentBoard?.title || (isLoading ? 'Loading...' : 'No Board Selected')}
                </h1>
                <Badge variant="secondary" className="text-xs">
                  {currentBoard ? `${cards.length} cards` : '0 cards'}
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search cards..."
                  className="pl-10 w-64 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={!currentBoard}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!currentBoard}>
                    <Filter className="h-4 w-4 mr-2" />
                    Priority
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterBy("all")}>All Priorities</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterBy("high")}>High Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("medium")}>Medium Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("low")}>Low Priority</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={!currentBoard}>
                    <Users className="h-4 w-4 mr-2" />
                    Member
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setMemberFilter("all")}>All Members</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {teamMembers.map((member) => (
                    <DropdownMenuItem 
                      key={member.id} 
                      onClick={() => setMemberFilter(member.id)}
                      className="flex items-center gap-2"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarFallback 
                          className="text-xs"
                          style={{ backgroundColor: member.color }}
                        >
                          {member.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {member.name}
                    </DropdownMenuItem>
                  ))}
                  {teamMembers.length === 0 && (
                    <DropdownMenuItem disabled>No team members</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button 
                variant={showCalendarView ? "default" : "outline"}
                size="sm" 
                disabled={!currentBoard}
                onClick={() => setShowCalendarView(!showCalendarView)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showCalendarView ? "Hide Calendar" : "Show Calendar"}
              </Button>

              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="cursor-pointer">
                    <AvatarImage src="/abstract-geometric-shapes.png" />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!isAdmin ? (
                    <DropdownMenuItem onClick={() => setShowAdminLogin(true)}>
                      <Crown className="h-4 w-4 mr-2" />
                      Admin Login
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled className="text-muted-foreground">
                      <Crown className="h-4 w-4 mr-2" />
                      Admin Mode
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    {isAdmin ? "Sign out (Admin)" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="px-6 pb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <span>Workspace</span>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">
                {currentBoard?.title || (isLoading ? 'Loading...' : 'No Board Selected')}
              </span>
              {currentBoard && searchQuery && (
                <>
                  <span className="mx-2">/</span>
                  <span>Search: "{searchQuery}"</span>
                </>
              )}
              {currentBoard && filterBy !== "all" && (
                <>
                  <span className="mx-2">/</span>
                  <span>Filter: {filterBy} priority</span>
                </>
              )}
            </div>
          </div>
        </header>

        <main className={`flex-1 ${showCalendarView ? 'flex flex-col lg:flex-row' : 'p-6'}`}>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading board...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : boards.length === 0 && !isLoading ? (
            // Show creation interface for admins, loading for non-admins (modal will appear)
            isAdmin ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-4">
                <Folder className="h-16 w-16 text-muted-foreground opacity-50" />
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No boards found</h3>
                  <p className="text-muted-foreground">Create your first board to get started</p>
                </div>
                <BoardManager 
                  trigger={
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Board
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading boards...</div>
              </div>
            )
          ) : !currentBoard ? (
            // User has accessible boards but none is currently selected
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-3">
                <div className="text-muted-foreground">No board selected</div>
                <div className="flex gap-2 justify-center">
                  <BoardManager 
                    trigger={
                      <Button variant="outline">
                        <Folder className="h-4 w-4 mr-2" />
                        Select Board
                      </Button>
                    }
                  />
                  {!isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => setShowBoardAccessModal(true)}
                    >
                      <Key className="h-4 w-4 mr-2" />
                      Add Board Access
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ) : currentBoard && (isAdminSession() || getBoardAccess().includes(currentBoard.id)) ? (
            <BoardAccessGate boardId={currentBoard.id}>
              <>
                {/* Board Content - 60% Width */}
                <div className={
                  showCalendarView 
                    ? "hidden lg:block lg:w-[60%] lg:p-4 lg:border-r border-border min-h-0 overflow-hidden" 
                    : "w-full p-6"
                }>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={customCollisionDetection}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  >
                  <SortableContext items={filteredLists.map(list => list.id)} strategy={horizontalListSortingStrategy}>
                    <div className={`flex gap-4 lg:gap-6 overflow-x-auto pb-6 ${showCalendarView ? 'lg:gap-3' : ''}`}>
                      {filteredLists.map((list) => (
                        <SortableList key={list.id} list={list} onCardClick={handleCardClick} isCalendarView={showCalendarView} />
                      ))}

                      <div className={`flex-shrink-0 ${showCalendarView ? 'w-64 lg:w-56' : 'w-80'}`}>
                      {isAddingList ? (
                        <div className="space-y-3 p-3 bg-card rounded-lg border">
                          <Input
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            placeholder="Enter list title..."
                            className="w-full"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleAddList()
                              } else if (e.key === "Escape") {
                                setIsAddingList(false)
                                setNewListTitle("")
                              }
                            }}
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleAddList} disabled={!newListTitle.trim()}>
                              Add List
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setIsAddingList(false)
                                setNewListTitle("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          className="w-full h-12 border-2 border-dashed border-border hover:border-primary backdrop-blur-sm"
                          onClick={() => setIsAddingList(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add another list
                        </Button>
                      )}
                      </div>
                    </div>
                  </SortableContext>

                  <DragOverlay>
                    {activeCard ? (
                      <Card className="p-4 rotate-3 shadow-lg">
                        <div className="space-y-3">
                          <h3 className="font-medium text-card-foreground font-heading">{activeCard.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{activeCard.description}</p>
                        </div>
                      </Card>
                    ) : activeList ? (
                      <div className="w-80 bg-background border rounded-lg shadow-lg rotate-3 opacity-90">
                        <div className="p-4 border-b">
                          <h3 className="font-semibold text-foreground font-heading flex items-center gap-2">
                            {activeList.title}
                            <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">
                              {listsWithCards.find(l => l.id === activeList.id)?.cards.length || 0}
                            </span>
                          </h3>
                        </div>
                        <div className="p-4 text-sm text-muted-foreground">
                          Dragging list...
                        </div>
                      </div>
                    ) : null}
                  </DragOverlay>
                </DndContext>
                </div>

                {/* Calendar Content - 40% Width */}
                {showCalendarView && (
                  <div className="w-full lg:w-[40%] p-4 overflow-y-auto min-h-0">
                    <div className="h-full min-h-[500px] lg:min-h-[600px]">
                      <div className="lg:hidden mb-4 p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground text-center">
                          Calendar view. Switch back to see your boards.
                        </p>
                      </div>
                      <CalendarView />
                    </div>
                  </div>
                )}
              </>
            </BoardAccessGate>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Access denied or board not found</div>
            </div>
          )}
        </main>
      </div>

      {/* Admin Login Modal */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
            <DialogDescription>Enter admin password to manage boards</DialogDescription>
          </DialogHeader>
          <AdminLogin onSuccess={handleAdminLoginSuccess} />
        </DialogContent>
      </Dialog>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
      />

      {/* Board Access Modal */}
      <BoardAccessModal
        open={showBoardAccessModal}
        onOpenChange={setShowBoardAccessModal}
        onSuccess={handleBoardAccessSuccess}
      />
    </div>
  )
}
