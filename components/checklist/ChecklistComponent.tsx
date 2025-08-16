"use client"

import { useState } from "react"
import { useBoardStore } from "@/store/boardStore"
import { ChecklistItem } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Plus, X, Trash2 } from "lucide-react"

interface ChecklistComponentProps {
  cardId: string
  checklist: ChecklistItem[]
  isEditing: boolean
}

export function ChecklistComponent({ cardId, checklist, isEditing }: ChecklistComponentProps) {
  const { createChecklistItem, updateChecklistItem, deleteChecklistItem } = useBoardStore()
  const [newItemContent, setNewItemContent] = useState("")
  const [isAddingItem, setIsAddingItem] = useState(false)

  const completedCount = checklist.filter(item => item.completed).length
  const totalCount = checklist.length
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return

    try {
      await createChecklistItem({
        content: newItemContent.trim(),
        cardId,
        completed: false,
        position: (checklist.length + 1) * 1000,
      })
      setNewItemContent("")
      setIsAddingItem(false)
    } catch (error) {
      console.error("Failed to add checklist item:", error)
    }
  }

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    try {
      await updateChecklistItem(itemId, { completed })
    } catch (error) {
      console.error("Failed to update checklist item:", error)
    }
  }

  const handleUpdateContent = async (itemId: string, content: string) => {
    if (!content.trim()) return

    try {
      await updateChecklistItem(itemId, { content: content.trim() })
    } catch (error) {
      console.error("Failed to update checklist item:", error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteChecklistItem(itemId)
    } catch (error) {
      console.error("Failed to delete checklist item:", error)
    }
  }

  const sortedChecklist = [...checklist].sort((a, b) => a.position - b.position)

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Progress</span>
            <span className="text-muted-foreground">
              {completedCount}/{totalCount} completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>
      )}

      {/* Checklist items */}
      <div className="space-y-2">
        {sortedChecklist.map((item) => (
          <ChecklistItemComponent
            key={item.id}
            item={item}
            isEditing={isEditing}
            onToggle={(completed) => handleToggleItem(item.id, completed)}
            onUpdateContent={(content) => handleUpdateContent(item.id, content)}
            onDelete={() => handleDeleteItem(item.id)}
          />
        ))}
      </div>

      {/* Add new item */}
      {isEditing && (
        <div className="space-y-2">
          {isAddingItem ? (
            <div className="flex items-center gap-2">
              <Input
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Add an item..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleAddItem()
                  } else if (e.key === "Escape") {
                    setIsAddingItem(false)
                    setNewItemContent("")
                  }
                }}
                autoFocus
              />
              <Button size="sm" onClick={handleAddItem} disabled={!newItemContent.trim()}>
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsAddingItem(false)
                  setNewItemContent("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setIsAddingItem(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add item
            </Button>
          )}
        </div>
      )}

      {totalCount === 0 && !isEditing && (
        <div className="text-sm text-muted-foreground italic text-center py-4">
          No checklist items
        </div>
      )}
    </div>
  )
}

interface ChecklistItemComponentProps {
  item: ChecklistItem
  isEditing: boolean
  onToggle: (completed: boolean) => void
  onUpdateContent: (content: string) => void
  onDelete: () => void
}

function ChecklistItemComponent({
  item,
  isEditing,
  onToggle,
  onUpdateContent,
  onDelete
}: ChecklistItemComponentProps) {
  const [isEditingContent, setIsEditingContent] = useState(false)
  const [editContent, setEditContent] = useState(item.content)

  const handleSaveContent = () => {
    if (editContent.trim() !== item.content) {
      onUpdateContent(editContent.trim())
    }
    setIsEditingContent(false)
  }

  const handleCancelEdit = () => {
    setEditContent(item.content)
    setIsEditingContent(false)
  }

  return (
    <div className="flex items-center gap-2 group">
      <Checkbox
        checked={item.completed}
        onCheckedChange={(checked) => onToggle(checked as boolean)}
        id={`checklist-item-${item.id}`}
        className="border-2 border-gray-800 dark:border-gray-200"
      />
      
      <div className="flex-1 min-w-0">
        {isEditingContent && isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSaveContent()
                } else if (e.key === "Escape") {
                  handleCancelEdit()
                }
              }}
              onBlur={handleSaveContent}
              autoFocus
            />
          </div>
        ) : (
          <Label
            htmlFor={`checklist-item-${item.id}`}
            className={`cursor-pointer text-sm ${
              item.completed ? "line-through text-muted-foreground" : ""
            }`}
            onDoubleClick={() => {
              if (isEditing) {
                setIsEditingContent(true)
              }
            }}
          >
            {item.content}
          </Label>
        )}
      </div>

      {isEditing && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}