"use client"

import { useState } from "react"
import { setAdminSession } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AdminLoginProps {
  onSuccess: () => void
}

export function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async () => {
    if (!password.trim()) {
      setError("Please enter a password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })
      
      if (response.ok) {
        setAdminSession(true)
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || "Invalid admin password")
      }
    } catch (error) {
      setError("Login failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Admin Access</CardTitle>
        <CardDescription>Enter admin password to create boards</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="password"
          placeholder="Admin password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          disabled={isLoading}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button 
          onClick={handleLogin} 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login as Admin"}
        </Button>
      </CardContent>
    </Card>
  )
}