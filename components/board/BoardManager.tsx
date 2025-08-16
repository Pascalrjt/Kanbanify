"use client"

import { useState, useEffect } from "react"
import { useBoardStore } from "@/store/boardStore"
import { Board } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { isAdminSession } from "@/lib/auth"
import { getBoardAccess, validateBoardAccess, addBoardAccess } from "@/lib/boardAccess"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  Folder,
  Trash2,
  Edit,
  Eye,
  Users,
  MoreHorizontal,
  Crown,
  Key,
  Copy,
  Lock,
  Unlock,
} from "lucide-react"

const BACKGROUND_COLORS = [
  "#0079bf", // Blue (default)
  "#d29034", // Orange
  "#519839", // Green
  "#b04632", // Red
  "#89609e", // Purple
  "#cd5a91", // Pink
  "#4bbf6b", // Light Green
  "#00aecc", // Cyan
  "#838c91", // Gray
]

interface BoardManagerProps {
  trigger?: React.ReactNode
}

export function BoardManager({ trigger }: BoardManagerProps) {
  const {
    boards,
    currentBoard,
    createBoard,
    updateBoard,
    deleteBoard,
    setCurrentBoard,
    fetchBoard,
  } = useBoardStore()

  const [isOpen, setIsOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [isEditing, setIsEditing] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Board access code state
  const [boardAccessCode, setBoardAccessCode] = useState("")
  const [isAccessingBoard, setIsAccessingBoard] = useState(false)
  const [accessError, setAccessError] = useState("")
  const [accessSuccess, setAccessSuccess] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [background, setBackground] = useState(BACKGROUND_COLORS[0])

  // Check admin session on mount and when dialog opens
  useEffect(() => {
    setIsAdmin(isAdminSession())
  }, [isOpen])

  // Filter boards based on access
  const accessibleBoards = boards.filter(board => 
    getBoardAccess().includes(board.id) || isAdmin
  )

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setBackground(BACKGROUND_COLORS[0])
    setIsCreating(false)
    setIsEditing(null)
  }

  const handleCreateBoard = async () => {
    if (!title.trim()) return
    if (!isAdmin) return

    try {
      await createBoard({
        title: title.trim(),
        description: description.trim(),
        background,
        // No need for adminPassword since we're already authenticated
      })
      resetForm()
    } catch (error) {
      console.error("Failed to create board:", error)
    }
  }

  const handleUpdateBoard = async (boardId: string) => {
    if (!title.trim()) return

    try {
      await updateBoard(boardId, {
        title: title.trim(),
        description: description.trim(),
        background,
      })
      resetForm()
    } catch (error) {
      console.error("Failed to update board:", error)
    }
  }

  const handleDeleteBoard = async (boardId: string) => {
    if (!isAdmin) {
      console.error("Only admins can delete boards")
      return
    }
    
    const board = boards.find(b => b.id === boardId)
    const boardTitle = board?.title || "this board"
    
    // Confirm deletion
    if (!confirm(`Are you sure you want to delete "${boardTitle}"? This action cannot be undone and will delete all lists, cards, and data associated with this board.`)) {
      return
    }
    
    try {
      await deleteBoard(boardId)
    } catch (error) {
      console.error("Failed to delete board:", error)
    }
  }

  const handleSelectBoard = async (board: Board) => {
    try {
      setCurrentBoard(board.id)
      await fetchBoard(board.id)
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to select board:", error)
    }
  }

  const handleEditBoard = (board: Board) => {
    setTitle(board.title)
    setDescription(board.description || "")
    setBackground(board.background)
    setIsEditing(board.id)
    setIsCreating(false)
  }

  const handleAccessBoard = async () => {
    if (!boardAccessCode.trim()) {
      setAccessError("Please enter a board access code")
      return
    }

    setIsAccessingBoard(true)
    setAccessError("")

    try {
      // First, let's try to find the board by access code
      const response = await fetch('/api/boards')
      const allBoards = await response.json()
      
      // Find board with matching access code
      const targetBoard = allBoards.find((board: Board) => board.accessCode === boardAccessCode.trim())
      
      if (!targetBoard) {
        setAccessError("Invalid access code")
        setIsAccessingBoard(false)
        return
      }

      // Validate access
      const isValid = await validateBoardAccess(targetBoard.id, boardAccessCode.trim())
      
      if (isValid) {
        addBoardAccess(targetBoard.id)
        setBoardAccessCode("")
        setAccessError("")
        setAccessSuccess(`Successfully gained access to "${targetBoard.title}"!`)
        
        // Refresh the page after a short delay to show the new board
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setAccessError("Invalid access code")
      }
    } catch (error) {
      setAccessError("Failed to access board. Please try again.")
    } finally {
      setIsAccessingBoard(false)
    }
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Folder className="h-4 w-4 mr-2" />
      Boards
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent
        className="
          w-[95vw]
          max-w-[95vw]
          md:max-w-[90vw]
          xl:max-w-6xl
          2xl:max-w-7xl
          max-h-[90vh]
          overflow-y-auto
        "
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Board Manager
          </DialogTitle>
          <DialogDescription>
            Create, edit, and manage your boards. Switch between boards or
            customize their appearance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create/Edit Board Form */}
          {(isCreating || isEditing) && (
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">
                    {isEditing ? "Edit Board" : "Create New Board"}
                  </h3>
                  <Button variant="ghost" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Board title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2 flex-wrap">
                      {BACKGROUND_COLORS.map((color) => (
                        <button
                          key={color}
                          className={`w-8 h-8 rounded-md border-2 ${
                            background === color
                              ? "border-foreground"
                              : "border-transparent"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setBackground(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Board description..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={
                      isEditing
                        ? () => handleUpdateBoard(isEditing)
                        : handleCreateBoard
                    }
                    disabled={!title.trim()}
                  >
                    {isEditing ? "Update Board" : "Create Board"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Admin Section */}
          {isAdmin && !isCreating && !isEditing && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">Admin Panel</span>
              </div>
              <Button
                onClick={() => setIsCreating(true)}
                className="w-full"
                variant="default"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Board
              </Button>
            </div>
          )}

          {/* Board Access Code Section */}
          {!isAdmin && !isCreating && !isEditing && (
            <div className="border rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-2 mb-3">
                <Key className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-800">Access Board</span>
              </div>
              <div className="space-y-3">
                <p className="text-sm text-green-700">
                  Enter a board access code to gain access to additional boards
                  {accessibleBoards.length > 0 && (
                    <span className="block mt-1 text-xs">
                      Currently accessing {accessibleBoards.length} board{accessibleBoards.length === 1 ? '' : 's'}
                    </span>
                  )}
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter board access code..."
                    value={boardAccessCode}
                    onChange={(e) => {
                      setBoardAccessCode(e.target.value)
                      if (accessError) setAccessError("")
                      if (accessSuccess) setAccessSuccess("")
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAccessBoard()}
                    disabled={isAccessingBoard}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAccessBoard}
                    disabled={isAccessingBoard || !boardAccessCode.trim()}
                    className="shrink-0"
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    {isAccessingBoard ? "Accessing..." : "Access"}
                  </Button>
                </div>
                {accessError && (
                  <p className="text-sm text-red-600">{accessError}</p>
                )}
                {accessSuccess && (
                  <p className="text-sm text-green-600">{accessSuccess}</p>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Boards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">
                {isAdmin ? "All Boards" : "Your Accessible Boards"}
              </h3>
              {isAdmin && (
                <Badge variant="secondary" className="text-xs">
                  <Crown className="h-3 w-3 mr-1" />
                  Admin
                </Badge>
              )}
            </div>
            {accessibleBoards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>
                  {isAdmin ? "No boards yet" : "No accessible boards"}
                </div>
                <div className="text-sm">
                  {isAdmin 
                    ? "Create your first board to get started"
                    : "Enter a board access code above to access boards"
                  }
                </div>
              </div>
            ) : (
              <div
                className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  lg:grid-cols-3
                  gap-6
                "
              >
                {accessibleBoards.map((board) => (
                  <Card
                    key={board.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md min-w-0 ${
                      currentBoard?.id === board.id ? "ring-2 ring-primary" : ""
                    }`}
                    style={{
                      borderTop: `4px solid ${board.background}`,
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1 min-w-0">
                          <h4 className="font-medium line-clamp-2 break-words">
                            {board.title}
                          </h4>
                          {board.description && (
                            <p className="text-sm text-muted-foreground line-clamp-3 break-words">
                              {board.description}
                            </p>
                          )}
                        </div>

                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48" align="end">
                            <div className="space-y-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleSelectBoard(board)}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Open Board
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleEditBoard(board)}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Board
                              </Button>
                              {isAdmin && (
                                <>
                                  <Separator />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start text-destructive"
                                    onClick={() => handleDeleteBoard(board.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Board
                                  </Button>
                                </>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Folder className="h-3 w-3" />
                          {board.lists?.length || 0} lists
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {board.members?.length || 0} members
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {currentBoard?.id === board.id && (
                            <Badge variant="secondary" className="text-xs">
                              Current
                            </Badge>
                          )}
                          {!isAdmin && (
                            <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                              <Key className="h-2 w-2 mr-1" />
                              Access Code
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(board.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleSelectBoard(board)}
                      >
                        {currentBoard?.id === board.id
                          ? "Current Board"
                          : "Open Board"}
                      </Button>

                      {/* Admin Access Code Display */}
                      {isAdmin && board.accessCode && (
                        <div className="mt-3 p-2 bg-blue-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-blue-800">Access Code:</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigator.clipboard.writeText(board.accessCode!)}
                              className="h-6 px-2 text-blue-600 hover:text-blue-800"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="font-mono text-xs text-blue-700 mt-1">
                            {board.accessCode}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}