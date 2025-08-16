"use client"

import { useState } from "react"
import { validateBoardAccess, addBoardAccess } from "@/lib/boardAccess"
import { isAdminSession } from "@/lib/auth"
import { AdminLogin } from "@/components/auth/AdminLogin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Key, 
  Crown, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  Plus
} from "lucide-react"

interface BoardAccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function BoardAccessModal({ open, onOpenChange, onSuccess }: BoardAccessModalProps) {
  const [boardAccessCode, setBoardAccessCode] = useState("")
  const [isAccessingBoard, setIsAccessingBoard] = useState(false)
  const [accessError, setAccessError] = useState("")
  const [accessSuccess, setAccessSuccess] = useState("")
  const [isAdmin, setIsAdmin] = useState(isAdminSession())
  const [showAdminLogin, setShowAdminLogin] = useState(false)

  const handleAccessBoard = async () => {
    if (!boardAccessCode.trim()) {
      setAccessError("Please enter a board access code")
      return
    }

    setIsAccessingBoard(true)
    setAccessError("")
    setAccessSuccess("")

    try {
      // First, let's try to find the board by access code
      const response = await fetch('/api/boards')
      const allBoards = await response.json()
      
      // Find board with matching access code
      const targetBoard = allBoards.find((board: any) => board.accessCode === boardAccessCode.trim())
      
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
        
        // Call success callback after short delay
        setTimeout(() => {
          onSuccess()
          onOpenChange(false)
          // Reset state
          setAccessSuccess("")
          setBoardAccessCode("")
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

  const handleAdminLoginSuccess = () => {
    setIsAdmin(true)
    setShowAdminLogin(false)
    // Call success callback for admin login
    setTimeout(() => {
      onSuccess()
      onOpenChange(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle>Welcome to Kanbanify</DialogTitle>
          <DialogDescription>
            Enter a board access code to join your team's workspace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success Message */}
          {accessSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {accessSuccess}
              </AlertDescription>
            </Alert>
          )}

          {/* Board Access Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-blue-600" />
              <h3 className="font-medium">Enter Board Access Code</h3>
            </div>
            
            <div className="space-y-3">
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
                className="text-center font-mono"
              />
              
              {accessError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{accessError}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={handleAccessBoard}
                disabled={isAccessingBoard || !boardAccessCode.trim()}
                className="w-full"
                size="lg"
              >
                {isAccessingBoard ? (
                  "Accessing Board..."
                ) : (
                  <>
                    Access Board
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Admin Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-600" />
              <h3 className="font-medium">Admin Access</h3>
            </div>
            
            {!isAdmin ? (
              <>
                {!showAdminLogin ? (
                  <div className="text-center space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Are you an admin? Login to create and manage boards
                    </p>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAdminLogin(true)}
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Admin Login
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <AdminLogin onSuccess={handleAdminLoginSuccess} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowAdminLogin(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded border border-amber-200">
                  <Crown className="h-4 w-4 inline mr-1" />
                  Admin authenticated
                </p>
                <Button
                  className="w-full"
                  onClick={() => {
                    onSuccess()
                    onOpenChange(false)
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Board
                </Button>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center p-3 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600">
              Need help? Contact your team admin for a board access code, or if you're an admin, 
              login above to create your first board.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}