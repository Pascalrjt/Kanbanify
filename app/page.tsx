"use client"

import { useState } from "react"
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
} from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Assignee {
  id: string
  name: string
  avatar?: string
}

interface CardData {
  id: string
  title: string
  description: string
  assignees: Assignee[]
  dueDate: string
  priority: string
  listId: string
}

interface ListData {
  id: string
  title: string
  cards: CardData[]
}

function DraggableCard({ card }: { card: CardData }) {
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
    >
      <div className="space-y-3">
        <h3 className="font-medium text-card-foreground font-heading">{card.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{card.description}</p>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(card.priority)}`}>
            {card.priority}
          </span>
          <span className="text-xs text-muted-foreground">Due: {new Date(card.dueDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {card.assignees.map((assignee) => (
              <Avatar key={assignee.id} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                <AvatarFallback className="text-xs">
                  {assignee.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

function DroppableList({ list }: { list: ListData }) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-foreground font-heading flex items-center gap-2">
          {list.title}
          <span className="bg-muted text-muted-foreground text-xs px-2 py-1 rounded-full">{list.cards.length}</span>
        </h2>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <SortableContext items={list.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 min-h-[200px] p-2 rounded-lg border-2 border-dashed border-transparent hover:border-primary/20 transition-colors">
          {list.cards.map((card) => (
            <DraggableCard key={card.id} card={card} />
          ))}
        </div>
      </SortableContext>

      <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground mt-3">
        <Plus className="h-4 w-4 mr-2" />
        Add a card
      </Button>
    </div>
  )
}

export default function KanbanBoard() {
  const [lists, setLists] = useState<ListData[]>([
    {
      id: "1",
      title: "To Do",
      cards: [
        {
          id: "1",
          title: "Design new landing page",
          description: "Create wireframes and mockups for the new homepage",
          assignees: [
            { id: "1", name: "Alice Johnson", avatar: "/diverse-woman-portrait.png" },
            { id: "2", name: "Bob Smith", avatar: "/thoughtful-man.png" },
          ],
          dueDate: "2024-01-15",
          priority: "high",
          listId: "1",
        },
        {
          id: "2",
          title: "Update documentation",
          description: "Review and update API documentation",
          assignees: [{ id: "3", name: "Carol Davis", avatar: "/professional-woman.png" }],
          dueDate: "2024-01-20",
          priority: "medium",
          listId: "1",
        },
      ],
    },
    {
      id: "2",
      title: "In Progress",
      cards: [
        {
          id: "3",
          title: "Implement user authentication",
          description: "Set up OAuth and session management",
          assignees: [{ id: "4", name: "David Wilson", avatar: "/man-developer.png" }],
          dueDate: "2024-01-18",
          priority: "high",
          listId: "2",
        },
      ],
    },
    {
      id: "3",
      title: "Review",
      cards: [
        {
          id: "4",
          title: "Code review for payment system",
          description: "Review pull request for Stripe integration",
          assignees: [
            { id: "1", name: "Alice Johnson", avatar: "/diverse-woman-portrait.png" },
            { id: "5", name: "Eve Brown", avatar: "/woman-manager.png" },
          ],
          dueDate: "2024-01-16",
          priority: "high",
          listId: "3",
        },
      ],
    },
    {
      id: "4",
      title: "Done",
      cards: [
        {
          id: "5",
          title: "Set up CI/CD pipeline",
          description: "Configure GitHub Actions for automated testing",
          assignees: [{ id: "4", name: "David Wilson", avatar: "/man-developer.png" }],
          dueDate: "2024-01-10",
          priority: "medium",
          listId: "4",
        },
      ],
    },
  ])

  const [activeCard, setActiveCard] = useState<CardData | null>(null)
  const [currentBoard, setCurrentBoard] = useState("Website Redesign")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterBy, setFilterBy] = useState("all")

  // Mock boards data
  const boards = [
    { id: "1", name: "Website Redesign", color: "bg-blue-500", active: true },
    { id: "2", name: "Mobile App", color: "bg-green-500", active: false },
    { id: "3", name: "Marketing Campaign", color: "bg-purple-500", active: false },
  ]

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const card = lists.flatMap((list) => list.cards).find((card) => card.id === active.id)

    if (card) {
      setActiveCard(card)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeCardId = active.id as string
    const overCardId = over.id as string

    // Find the active card and its current list
    let activeCard: CardData | undefined
    let activeListIndex = -1
    let activeCardIndex = -1

    for (let i = 0; i < lists.length; i++) {
      const cardIndex = lists[i].cards.findIndex((card) => card.id === activeCardId)
      if (cardIndex !== -1) {
        activeCard = lists[i].cards[cardIndex]
        activeListIndex = i
        activeCardIndex = cardIndex
        break
      }
    }

    if (!activeCard) return

    // Find the target list (either by card or by list ID)
    let targetListIndex = -1
    let targetCardIndex = -1

    // Check if we're dropping on another card
    for (let i = 0; i < lists.length; i++) {
      const cardIndex = lists[i].cards.findIndex((card) => card.id === overCardId)
      if (cardIndex !== -1) {
        targetListIndex = i
        targetCardIndex = cardIndex
        break
      }
    }

    // If not dropping on a card, check if dropping on a list
    if (targetListIndex === -1) {
      targetListIndex = lists.findIndex((list) => list.id === overCardId)
      targetCardIndex = lists[targetListIndex]?.cards.length || 0
    }

    if (targetListIndex === -1) return

    // Update the lists state
    setLists((prevLists) => {
      const newLists = [...prevLists]

      // Remove card from source list
      newLists[activeListIndex].cards.splice(activeCardIndex, 1)

      // Update card's listId
      const updatedCard = { ...activeCard!, listId: newLists[targetListIndex].id }

      // Add card to target list
      newLists[targetListIndex].cards.splice(targetCardIndex, 0, updatedCard)

      return newLists
    })
  }

  // Filtered cards based on search and filter
  const filteredLists = lists.map((list) => ({
    ...list,
    cards: list.cards.filter((card) => {
      const matchesSearch =
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFilter = filterBy === "all" || card.priority === filterBy
      return matchesSearch && matchesFilter
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
              <h3 className="text-sm font-medium text-sidebar-foreground mb-2">Boards</h3>
              <div className="space-y-1">
                {boards.map((board) => (
                  <Button
                    key={board.id}
                    variant={board.active ? "secondary" : "ghost"}
                    className="w-full justify-start text-sm"
                    onClick={() => setCurrentBoard(board.name)}
                  >
                    <div className={`w-3 h-3 rounded-full ${board.color} mr-2`} />
                    {board.name}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Folder className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm">
                <Users className="h-4 w-4 mr-2" />
                Team Members
              </Button>
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
                <h1 className="text-2xl font-bold text-foreground font-heading">{currentBoard}</h1>
                <Badge variant="secondary" className="text-xs">
                  {lists.reduce((acc, list) => acc + list.cards.length, 0)} cards
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
                    Filter
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterBy("all")}>All Cards</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setFilterBy("high")}>High Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("medium")}>Medium Priority</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setFilterBy("low")}>Low Priority</DropdownMenuItem>
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
              <span className="text-foreground font-medium">{currentBoard}</span>
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-6">
              {filteredLists.map((list) => (
                <DroppableList key={list.id} list={list} />
              ))}

              <div className="flex-shrink-0 w-80">
                <Button
                  variant="ghost"
                  className="w-full h-12 border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 backdrop-blur-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add another list
                </Button>
              </div>
            </div>

            <DragOverlay>
              {activeCard ? (
                <Card className="p-4 rotate-3 shadow-lg">
                  <div className="space-y-3">
                    <h3 className="font-medium text-card-foreground font-heading">{activeCard.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{activeCard.description}</p>
                  </div>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </main>
      </div>
    </div>
  )
}
