"use client"

import { useState } from "react"
import { useBoardStore } from "@/store/boardStore"
import { TeamMember } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Plus, Users, Trash2, User, BarChart3 } from "lucide-react"

const AVATAR_COLORS = [
  "#e91e63", // Pink
  "#9c27b0", // Purple
  "#673ab7", // Deep Purple
  "#3f51b5", // Indigo
  "#2196f3", // Blue
  "#03a9f4", // Light Blue
  "#00bcd4", // Cyan
  "#009688", // Teal
  "#4caf50", // Green
  "#8bc34a", // Light Green
  "#cddc39", // Lime
  "#ffeb3b", // Yellow
  "#ffc107", // Amber
  "#ff9800", // Orange
  "#ff5722", // Deep Orange
  "#795548", // Brown
  "#607d8b", // Blue Grey
]

function generateAvatarColor(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

interface TeamMemberManagerProps {
  trigger?: React.ReactNode
}

export function TeamMemberManager({ trigger }: TeamMemberManagerProps) {
  const { teamMembers, cards, createTeamMember, deleteTeamMember, currentBoard } = useBoardStore()
  const [isOpen, setIsOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState("")
  const [isAddingMember, setIsAddingMember] = useState(false)

  const handleAddMember = async () => {
    if (!newMemberName.trim() || !currentBoard) return

    try {
      await createTeamMember({
        name: newMemberName.trim(),
        boardId: currentBoard.id,
        color: generateAvatarColor(newMemberName.trim()),
      })
      setNewMemberName("")
      setIsAddingMember(false)
    } catch (error) {
      console.error("Failed to add team member:", error)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteTeamMember(memberId)
    } catch (error) {
      console.error("Failed to delete team member:", error)
    }
  }

  const getMemberWorkload = (memberId: string) => {
    return cards.filter(card => 
      card.assignees?.some(assignment => assignment.teamMemberId === memberId)
    ).length
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Users className="h-4 w-4 mr-2" />
      Team Members
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members
          </DialogTitle>
          <DialogDescription>
            Manage your team members, view workload distribution, and add new team members to your board.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{teamMembers.length}</div>
                  <div className="text-sm text-muted-foreground">Total Members</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">{cards.length}</div>
                  <div className="text-sm text-muted-foreground">Total Cards</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold">
                    {teamMembers.length > 0 ? Math.round(cards.length / teamMembers.length * 10) / 10 : 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Cards/Member</div>
                </div>
              </div>
            </Card>
          </div>

          <Separator />

          {/* Add new member */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Add Team Member</Label>
            {isAddingMember ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Member name..."
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddMember()
                    } else if (e.key === "Escape") {
                      setIsAddingMember(false)
                      setNewMemberName("")
                    }
                  }}
                  autoFocus
                />
                <Button size="sm" onClick={handleAddMember} disabled={!newMemberName.trim()}>
                  Add
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingMember(false)
                    setNewMemberName("")
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsAddingMember(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            )}
          </div>

          <Separator />

          {/* Team members list */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Current Members</Label>
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <div>No team members yet</div>
                <div className="text-sm">Add your first team member to get started</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {teamMembers.map((member) => {
                  const workload = getMemberWorkload(member.id)
                  return (
                    <Card key={member.id} className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback
                              className="text-sm font-medium"
                              style={{ backgroundColor: member.color }}
                            >
                              {member.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {workload} card{workload !== 1 ? 's' : ''} assigned
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {workload} cards
                          </Badge>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80">
                              <div className="space-y-3">
                                <div className="font-medium">Delete Team Member</div>
                                <div className="text-sm text-muted-foreground">
                                  Are you sure you want to remove <strong>{member.name}</strong> from the team?
                                  {workload > 0 && (
                                    <div className="mt-1 text-amber-600">
                                      ⚠️ This member is assigned to {workload} card{workload !== 1 ? 's' : ''}. 
                                      They will be unassigned.
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteMember(member.id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}