"use client"

import { useState, useEffect } from "react"
import { useBoardStore } from "@/store/boardStore"
import { Card as CardType, TeamMember } from "@/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Tag,
  CheckSquare,
  Trash2,
  Plus,
  X,
  Save,
  Users,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import ReactMarkdown from "react-markdown"
import { ChecklistComponent } from "@/components/checklist/ChecklistComponent"

interface CardDetailModalProps {
  card: CardType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CardDetailModal({ card: initialCard, open, onOpenChange }: CardDetailModalProps) {
  const { cards, updateCard, deleteCard, teamMembers, assignMemberToCard, unassignMemberFromCard } = useBoardStore()
  
  // Get the live card data from the store instead of using the prop
  const card = initialCard ? cards.find(c => c.id === initialCard.id) || initialCard : null
  
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")
  const [dueDate, setDueDate] = useState<Date | undefined>()
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isAssigneeMenuOpen, setIsAssigneeMenuOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset form when card changes
  useEffect(() => {
    if (card) {
      setTitle(card.title)
      setDescription(card.description || "")
      setPriority(card.priority as "low" | "medium" | "high")
      setDueDate(card.dueDate ? new Date(card.dueDate) : undefined)
    }
  }, [card])

  // Reset editing state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setIsEditing(false)
      setIsCalendarOpen(false)
      setIsAssigneeMenuOpen(false)
      setIsSaving(false)
    }
  }, [open])

  if (!card) return null

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return <AlertCircle className="h-3 w-3" />
      case "medium":
        return <Clock className="h-3 w-3" />
      case "low":
        return <CheckSquare className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const assignedMemberIds = card.assignees?.map(a => a.teamMemberId) || []
  const availableMembers = teamMembers.filter(member => !assignedMemberIds.includes(member.id))

  const handleSave = async () => {
    if (!card.id) return
    
    setIsSaving(true)
    try {
      await updateCard(card.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate?.toISOString(),
      })
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update card:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!card.id) return
    
    try {
      await deleteCard(card.id)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to delete card:", error)
    }
  }

  const handleAssignMember = async (memberId: string) => {
    if (!card.id) return
    
    try {
      await assignMemberToCard(card.id, memberId)
      setIsAssigneeMenuOpen(false)
    } catch (error) {
      console.error("Failed to assign member:", error)
    }
  }

  const handleUnassignMember = async (memberId: string) => {
    if (!card.id) return
    
    try {
      await unassignMemberFromCard(card.id, memberId)
    } catch (error) {
      console.error("Failed to unassign member:", error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-6xl sm:max-w-6xl md:max-w-6xl lg:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditing ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
                placeholder="Card title..."
              />
            ) : (
              <span className="text-lg font-semibold">{card.title}</span>
            )}
            <div className="flex items-center gap-2">
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              {isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false)
                      setTitle(card.title)
                      setDescription(card.description || "")
                      setPriority(card.priority as "low" | "medium" | "high")
                      setDueDate(card.dueDate ? new Date(card.dueDate) : undefined)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    <Save className="h-4 w-4 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
          <DialogDescription>
            View and edit card details, including description, priority, due date, assignees, and checklist items.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Priority */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Priority
              </Label>
              {isEditing ? (
                <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={`text-xs ${getPriorityColor(card.priority || 'medium')} w-fit`}>
                  {getPriorityIcon(card.priority || 'medium')}
                  <span className="ml-1 capitalize">{card.priority || 'medium'}</span>
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Description</Label>
              {isEditing ? (
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-32"
                />
              ) : (
                <div className="border rounded-md p-3 min-h-32 bg-muted/20">
                  {description ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>
                        {description}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">No description</span>
                  )}
                </div>
              )}
            </div>

            {/* Checklist */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Checklist
              </Label>
              <div className="border rounded-md p-3 bg-muted/20">
                <ChecklistComponent
                  cardId={card.id}
                  checklist={card.checklist || []}
                  isEditing={isEditing}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Due Date */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Due Date
              </Label>
              {isEditing ? (
                <div className="space-y-3">
                  <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal min-h-10 h-auto whitespace-normal">
                        <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="truncate">
                          {dueDate ? format(dueDate, "PPP") : "Set due date"}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
                      <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={(date) => {
                          if (date) {
                            // Preserve existing time when changing date
                            const newDate = new Date(date)
                            if (dueDate) {
                              newDate.setHours(dueDate.getHours())
                              newDate.setMinutes(dueDate.getMinutes())
                            } else {
                              // Default to 9:00 AM if no time was set
                              newDate.setHours(9, 0)
                            }
                            setDueDate(newDate)
                          } else {
                            setDueDate(undefined)
                          }
                          setIsCalendarOpen(false)
                        }}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  {dueDate && (
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground">Time</Label>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="23"
                            value={dueDate.getHours()}
                            onChange={(e) => {
                              const hours = parseInt(e.target.value) || 0
                              const newDate = new Date(dueDate)
                              newDate.setHours(Math.max(0, Math.min(23, hours)))
                              setDueDate(newDate)
                            }}
                            className="w-16 text-center"
                            placeholder="HH"
                          />
                          <span className="text-muted-foreground">:</span>
                          <Input
                            type="number"
                            min="0"
                            max="59"
                            value={dueDate.getMinutes().toString().padStart(2, '0')}
                            onChange={(e) => {
                              const minutes = parseInt(e.target.value) || 0
                              const newDate = new Date(dueDate)
                              newDate.setMinutes(Math.max(0, Math.min(59, minutes)))
                              setDueDate(newDate)
                            }}
                            className="w-16 text-center"
                            placeholder="MM"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDueDate(undefined)
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm break-words">
                  {card.dueDate ? (
                    <span className="break-words">{format(new Date(card.dueDate), "PPP 'at' p")}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No due date</span>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Assignees */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                Assignees
              </Label>
              <div className="space-y-2">
                {card.assignees?.map((assignment) => (
                  <div key={assignment.teamMemberId} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback 
                          className="text-xs"
                          style={{ backgroundColor: assignment.teamMember?.color }}
                        >
                          {assignment.teamMember?.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("") || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{assignment.teamMember?.name}</span>
                    </div>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnassignMember(assignment.teamMemberId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {isEditing && availableMembers.length > 0 && (
                  <Popover open={isAssigneeMenuOpen} onOpenChange={setIsAssigneeMenuOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="h-4 w-4 mr-1" />
                        Add assignee
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-0">
                      <div className="max-h-48 overflow-y-auto">
                        {availableMembers.map((member) => (
                          <Button
                            key={member.id}
                            variant="ghost"
                            className="w-full justify-start p-2"
                            onClick={() => handleAssignMember(member.id)}
                          >
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback 
                                className="text-xs"
                                style={{ backgroundColor: member.color }}
                              >
                                {member.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {member.name}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
                
                {card.assignees?.length === 0 && !isEditing && (
                  <span className="text-muted-foreground italic text-sm">No assignees</span>
                )}
              </div>
            </div>

            <Separator />

            {/* Labels placeholder */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Labels
              </Label>
              <div className="text-sm text-muted-foreground italic">
                Labels functionality coming soon...
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Card
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}