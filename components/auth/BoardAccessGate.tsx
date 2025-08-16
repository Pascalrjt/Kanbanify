"use client"

import { useState, useEffect } from "react"
import { validateBoardAccess, getBoardAccess, addBoardAccess } from "@/lib/boardAccess"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BoardAccessGateProps {
  boardId: string
  children: React.ReactNode
}

export function BoardAccessGate({ boardId, children }: BoardAccessGateProps) {
  const [hasAccess, setHasAccess] = useState(false)
  const [accessCode, setAccessCode] = useState("")
  const [isChecking, setIsChecking] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    // Check if user already has access to this board
    const boardAccess = getBoardAccess()
    if (boardAccess.includes(boardId)) {
      setHasAccess(true)
    }
    setIsChecking(false)
  }, [boardId])

  const checkAccess = async () => {
    if (!accessCode.trim()) {
      setError("Please enter an access code")
      return
    }

    setIsChecking(true)
    setError("")

    try {
      const isValid = await validateBoardAccess(boardId, accessCode)
      
      if (isValid) {
        addBoardAccess(boardId)
        setHasAccess(true)
      } else {
        setError("Invalid access code")
      }
    } catch (error) {
      setError("Failed to validate access code")
    } finally {
      setIsChecking(false)
    }
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="text-lg">Checking access...</div>
        </div>
      </div>
    )
  }

  if (hasAccess) return <>{children}</>

  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Board Access Required</CardTitle>
          <CardDescription>Enter the access code for this board</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Enter access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAccess()}
            disabled={isChecking}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button 
            onClick={checkAccess} 
            className="w-full" 
            disabled={isChecking}
          >
            {isChecking ? "Checking..." : "Access Board"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}