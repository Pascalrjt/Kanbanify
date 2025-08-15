"use client"

import { useState } from "react"
import { useBoardStore } from "@/store/boardStore"
import { Board } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [background, setBackground] = useState(BACKGROUND_COLORS[0])

  const resetForm = () => {
    setTitle("")
    setDescription("")
    setBackground(BACKGROUND_COLORS[0])
    setIsCreating(false)
    setIsEditing(null)
  }

  const handleCreateBoard = async () => {
    if (!title.trim()) return

    try {
      await createBoard({
        title: title.trim(),
        description: description.trim(),
        background,
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

          {/* Create Board Button */}
          {!isCreating && !isEditing && (
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Board
            </Button>
          )}

          <Separator />

          {/* Boards Grid */}
          <div className="space-y-4">
            <h3 className="font-medium">Your Boards</h3>
            {boards.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No boards yet</div>
                <div className="text-sm">
                  Create your first board to get started
                </div>
              </div>
            ) : (
              <div
                className="
                  grid
                  grid-cols-[repeat(auto-fit,minmax(320px,420px))]
                  gap-6
                "
              >
                {boards.map((board) => (
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
                        {currentBoard?.id === board.id && (
                          <Badge variant="secondary" className="text-xs">
                            Current
                          </Badge>
                        )}
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