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

function SortableList({ list, onCardClick }: { list: ListType & { cards: CardType[] }; onCardClick: (card: CardType) => void }) {
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
      />
    </div>
  )
}

function DroppableList({ 
  list, 
  onCardClick, 
  dragHandleProps 
}: { 
  list: ListType & { cards: CardType[] }; 
  onCardClick: (card: CardType) => void;
  dragHandleProps?: any;
}) {
  const { createCard, updateList, deleteList } = useBoardStore()
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState("")
  const [isEditingList, setIsEditingList] = useState(false)
  const [editListTitle, setEditListTitle] = useState(list.title)
  
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
    <div className="flex-shrink-0 w-80">
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

      <SortableContext items={list.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div 
          ref={setNodeRef}
          className={`space-y-3 min-h-[200px] p-2 rounded-lg border-2 border-dashed transition-colors ${
            isOver ? "border-primary bg-primary/5" : "border-transparent hover:border-primary/20"
          }`}
        >
          {list.cards.map((card) => (
            <DraggableCard key={card.id} card={card} onCardClick={onCardClick} />
          ))}
          {list.cards.length === 0 && !isAddingCard && (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              Drop cards here or add a new one
            </div>
          )}
        </div>
      </SortableContext>

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
  const initializedRef = useRef(false)

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

  // Auto-select first board when boards are loaded and no current board is set
  useEffect(() => {
    if (!currentBoard && boards.length > 0 && initializedRef.current) {
      const firstBoard = boards[0]
      fetchBoard(firstBoard.id)
    }
  }, [boards, currentBoard])

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
    const { active } = args
    
    if (active.data.current?.type === 'list') {
      // For list dragging, use rectIntersection for better horizontal detection
      return rectIntersection(args)
    } else {
      // For card dragging, use closestCorners
      return closestCorners(args)
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
            className="w-full justify-start"
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
                  {currentBoard?.description && (
                    <div className="text-xs text-muted-foreground">{currentBoard.description}</div>
                  )}
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
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col relative z-10">
        <header className="border-b border-border bg-card/95 backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground font-heading">{currentBoard?.title || 'Loading...'}</h1>
                <Badge variant="secondary" className="text-xs">
                  {cards.length} cards
                </Badge>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search cards..."
                  className="pl-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
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
                  <Button variant="outline" size="sm">
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

              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Calendar
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
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="px-6 pb-4">
            <div className="flex items-center text-sm text-muted-foreground">
              <span>Workspace</span>
              <span className="mx-2">/</span>
              <span className="text-foreground font-medium">{currentBoard?.title || 'Loading...'}</span>
              {searchQuery && (
                <>
                  <span className="mx-2">/</span>
                  <span>Search: "{searchQuery}"</span>
                </>
              )}
              {filterBy !== "all" && (
                <>
                  <span className="mx-2">/</span>
                  <span>Filter: {filterBy} priority</span>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-muted-foreground">Loading board...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-red-500">Error: {error}</div>
            </div>
          ) : boards.length === 0 ? (
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
            <DndContext
              sensors={sensors}
              collisionDetection={customCollisionDetection}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredLists.map(list => list.id)} strategy={horizontalListSortingStrategy}>
                <div className="flex gap-6 overflow-x-auto pb-6">
                  {filteredLists.map((list) => (
                    <SortableList key={list.id} list={list} onCardClick={handleCardClick} />
                  ))}

                  <div className="flex-shrink-0 w-80">
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
                      className="w-full h-12 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 backdrop-blur-sm"
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
          )}
        </main>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        open={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
      />
    </div>
  )
}
