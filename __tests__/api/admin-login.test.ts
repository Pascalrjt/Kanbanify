import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/login/route'

// Mock auth
jest.mock('@/lib/auth', () => ({
  checkAdminPassword: jest.fn(),
}))

const mockCheckAdminPassword = require('@/lib/auth').checkAdminPassword

describe('/api/admin/login', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/admin/login', () => {
    it('should return success for valid password', async () => {
      mockCheckAdminPassword.mockReturnValue(true)

      const request = new NextRequest('http://localhost/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          password: 'correct-password',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(mockCheckAdminPassword).toHaveBeenCalledWith('correct-password')
    })

    it('should return error for invalid password', async () => {
      mockCheckAdminPassword.mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          password: 'wrong-password',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Invalid admin password')
      expect(mockCheckAdminPassword).toHaveBeenCalledWith('wrong-password')
    })

    it('should return error for missing password', async () => {
      const request = new NextRequest('http://localhost/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
      expect(mockCheckAdminPassword).not.toHaveBeenCalled()
    })

    it('should return error for empty password', async () => {
      const request = new NextRequest('http://localhost/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          password: '',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Password is required')
    })

    it('should handle JSON parsing errors', async () => {
      const request = new NextRequest('http://localhost/api/admin/login', {
        method: 'POST',
        body: 'invalid-json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Login failed')
    })

    it('should handle unexpected errors', async () => {
      mockCheckAdminPassword.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = new NextRequest('http://localhost/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({
          password: 'any-password',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Login failed')
    })
  })
})